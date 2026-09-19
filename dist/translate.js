#!/usr/bin/env node
/**
 * 模型描述翻译记忆维护脚本（npm run translate）。
 *
 * 构建本身离线且确定：只读取 i18n/descriptions/<locale>.json。本脚本负责让该文件
 * 与当前目录保持同步：为缺失译文的英文描述调用 OpenAI 兼容的 Chat Completions
 * 接口生成译文，并移除目录中已不存在的原文条目。
 *
 * 环境变量：TRANSLATE_API_KEY（必填，--dry-run 除外）、TRANSLATE_BASE_URL
 * （默认 https://api.openai.com/v1）、TRANSLATE_MODEL（默认 gpt-4o-mini）。
 * 参数：--locale <id> 仅处理某语言；--dry-run 只列出缺失数量，不请求也不写入。
 */
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { catalogPaths, loadCatalog } from './services/catalog.js';
import { parseArgv } from './utils/cli-utils.js';
import { writeJSONIfChanged } from './utils/file-utils.js';
const BATCH_SIZE = 25;
const REQUEST_TIMEOUT_MS = 90_000;
const MAX_ATTEMPTS = 2;
/** 单批翻译：以 JSON 往返，逐条校验 id 与非空文本 */
async function translateBatch(config, language, items) {
    const system = [
        'You translate one-line descriptions of AI models for a model pricing catalog.',
        `Translate each "text" from English into ${language.name ?? language.locale} (locale "${language.locale}").`,
        'Keep company, product and model names, acronyms and technical terms (API, tokens, MoE, JSON, SQL) in their original form.',
        'Be concise and natural; keep the original sentence-ending punctuation style.',
        'Respond with JSON only: {"translations":[{"id":<number>,"text":"<translation>"}]} covering every id exactly once.',
    ].join(' ');
    const response = await fetch(`${config.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
            authorization: `Bearer ${config.apiKey}`,
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            model: config.model,
            temperature: 0.2,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: JSON.stringify({ items }) },
            ],
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
    }
    const payload = (await response.json());
    const content = payload.choices?.[0]?.message?.content;
    if (!content)
        throw new Error('empty completion');
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed.translations))
        throw new Error('missing "translations" array');
    const expected = new Map(items.map((item) => [item.id, item.text]));
    const result = new Map();
    for (const entry of parsed.translations) {
        const text = typeof entry.text === 'string' ? entry.text.trim() : '';
        if (typeof entry.id !== 'number' || !expected.has(entry.id) || !text)
            continue;
        result.set(entry.id, text);
    }
    const missing = items.filter((item) => !result.has(item.id));
    if (missing.length > 0) {
        throw new Error(`${missing.length} item(s) missing from the completion`);
    }
    return result;
}
async function translateAll(config, language, sources) {
    const translated = new Map();
    for (let start = 0; start < sources.length; start += BATCH_SIZE) {
        const slice = sources.slice(start, start + BATCH_SIZE);
        const items = slice.map((text, index) => ({ id: start + index, text }));
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                const batch = await translateBatch(config, language, items);
                for (const item of items)
                    translated.set(item.text, batch.get(item.id));
                break;
            }
            catch (error) {
                const reason = error instanceof Error ? error.message : String(error);
                console.warn(`[${language.locale}] batch ${start / BATCH_SIZE + 1} attempt ${attempt} failed: ${reason}`);
            }
        }
        console.log(`[${language.locale}] ${translated.size}/${sources.length} translated`);
    }
    return translated;
}
async function main() {
    const args = parseArgv(process.argv);
    const dryRun = args['dry-run'] === true;
    const onlyLocale = typeof args.locale === 'string' ? args.locale : null;
    const catalog = await loadCatalog(catalogPaths(resolve(process.cwd())));
    // 英文是描述的源语言，其余每个 locale 都维护一份翻译记忆
    const targets = catalog.i18n
        .getLocales()
        .filter((l) => l.locale !== 'en' && (!onlyLocale || l.locale === onlyLocale));
    if (targets.length === 0) {
        console.error(onlyLocale ? `Unknown locale "${onlyLocale}"` : 'No target locales configured');
        process.exit(1);
    }
    const apiKey = process.env.TRANSLATE_API_KEY ?? '';
    if (!dryRun && !apiKey) {
        console.error('TRANSLATE_API_KEY is required (use --dry-run to only report missing entries)');
        process.exit(1);
    }
    const config = {
        apiKey,
        baseUrl: process.env.TRANSLATE_BASE_URL || 'https://api.openai.com/v1',
        model: process.env.TRANSLATE_MODEL || 'gpt-4o-mini',
    };
    // 当前目录出现过的全部英文描述：用于剪除已失效的记忆条目
    const liveSources = new Set();
    for (const provider of Object.values(catalog.data.providers)) {
        for (const model of Object.values(provider.models || {})) {
            if (model.description)
                liveSources.add(model.description);
        }
    }
    let failed = false;
    for (const language of targets) {
        const { untranslated } = catalog.processor.localizeNormalizedData(catalog.data, catalog.overrides, language.locale);
        const missing = [...new Set(untranslated)].sort();
        const memory = catalog.i18n.getDescriptionTranslations(language.locale);
        const stale = Object.keys(memory).filter((source) => !liveSources.has(source));
        console.log(`[${language.locale}] ${missing.length} description(s) to translate, ${stale.length} stale entr${stale.length === 1 ? 'y' : 'ies'} to prune`);
        if (dryRun)
            continue;
        const fresh = missing.length > 0 ? await translateAll(config, language, missing) : new Map();
        if (fresh.size < missing.length)
            failed = true;
        const next = {};
        for (const [source, text] of Object.entries(memory)) {
            if (liveSources.has(source))
                next[source] = text;
        }
        for (const [source, text] of fresh)
            next[source] = text;
        if (writeJSONIfChanged(catalog.i18n.descriptionTranslationsPath(language.locale), next)) {
            console.log(`[${language.locale}] wrote ${Object.keys(next).length} entries`);
        }
    }
    if (failed) {
        console.error('Some descriptions could not be translated; rerun to fill the gaps');
        process.exit(1);
    }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch((error) => {
        console.error('Translate failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=translate.js.map