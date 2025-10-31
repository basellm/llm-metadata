import { I18nService } from './i18n-service.js';
import { escapeMarkdownPipes, formatCapabilities, formatDetails, formatLimit, formatModalities, formatPricing, getMaxPrices, } from '../utils/format-utils.js';
// 常量配置
const TIME_PERIODS = {
    WEEK_MS: 7 * 24 * 60 * 60 * 1000,
    MONTH_MS: 30 * 24 * 60 * 60 * 1000,
    THREE_MONTHS_MS: 90 * 24 * 60 * 60 * 1000,
};
const DISPLAY_LIMITS = {
    CARDS_PER_SECTION: 20,
    OLDER_MODELS_TABLE: 50,
};
/** 文档生成服务 */
export class DocumentationGenerator {
    i18n;
    constructor(rootDir) {
        this.i18n = new I18nService(rootDir);
    }
    /** 生成文档头部 */
    generateDocumentHeader(title, intro, context, icon) {
        const { tr, stats, lastUpdated } = context;
        const titleWithIcon = icon ? `${icon} ${title}` : title;
        return `---
hide:
  - navigation
---

# ${titleWithIcon}

${intro}

!!! tip "${tr('stats.title')}"
    **${tr('stats.providers')}**: ${stats.providers} &nbsp;&nbsp;
    **${tr('stats.models')}**: ${stats.models} &nbsp;&nbsp;
    **${tr('stats.updated')}**: ${lastUpdated}

`;
    }
    /** 创建文档上下文 */
    createDocumentContext(manifest, locale) {
        const lastUpdated = new Date(manifest.generatedAt).toLocaleString(this.i18n.getDateLocale(locale), { timeZone: this.i18n.getTimeZone(locale) });
        const messages = this.i18n.getDocMessages(locale);
        const tr = (key) => messages[key] || key;
        const trWith = (key, vars) => {
            let text = messages[key] || key;
            for (const [k, v] of Object.entries(vars)) {
                text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
            }
            return text;
        };
        return {
            tr,
            trWith,
            stats: manifest.stats,
            lastUpdated,
        };
    }
    /** 将 YYYY 或 YYYY-MM 或 YYYY-MM-DD 字符串解析为时间戳（不可解析返回 null） */
    parseDateToTimestamp(dateStr) {
        if (!dateStr || typeof dateStr !== 'string')
            return null;
        const direct = Date.parse(dateStr);
        if (!Number.isNaN(direct))
            return direct;
        // 支持不完整日期格式
        const dateFormats = [
            { regex: /^\d{4}$/, format: (d) => `${d}-01-01` },
            { regex: /^\d{4}-\d{2}$/, format: (d) => `${d}-01` },
        ];
        for (const { regex, format } of dateFormats) {
            if (regex.test(dateStr)) {
                const ts = Date.parse(format(dateStr));
                return Number.isNaN(ts) ? null : ts;
            }
        }
        return null;
    }
    /** 计算 NewAPI 比率（文档用） */
    calculateNewApiRatios(cost) {
        const { maxInput, maxOutput, maxCacheRead } = getMaxPrices(cost);
        if (!maxInput) {
            return null;
        }
        const ratios = {
            model: maxInput / 2, // 基准: $2 per 1M tokens
            completion: null,
            cache: null,
        };
        if (maxOutput) {
            ratios.completion = maxOutput / maxInput;
        }
        if (maxCacheRead) {
            ratios.cache = maxCacheRead / maxInput;
        }
        return ratios;
    }
    /** 格式化 NewAPI 比率显示 */
    formatNewApiRatios(ratios) {
        if (!ratios)
            return '-';
        const parts = [`Model: ${ratios.model.toFixed(3)}`];
        if (ratios.completion !== null) {
            parts.push(`Completion: ${ratios.completion.toFixed(3)}`);
        }
        if (ratios.cache !== null) {
            parts.push(`Cache: ${ratios.cache.toFixed(3)}`);
        }
        return parts.join('<br/>');
    }
    /** 构建模型行数据 */
    buildModelRow(providerId, provider, modelId, model) {
        const releaseRaw = model.release_date || undefined;
        const releaseTs = this.parseDateToTimestamp(releaseRaw);
        const row = {
            providerId,
            providerName: provider.name || providerId,
            modelId,
            modelName: model.name || modelId,
            releaseRaw,
            releaseTs,
            pricing: formatPricing(model.cost),
            ratios: this.formatNewApiRatios(this.calculateNewApiRatios(model.cost)),
            capabilities: formatCapabilities(model),
            knowledge: model.knowledge,
            modalities: formatModalities(model.modalities),
            details: formatDetails(model),
        };
        if (typeof model.limit?.context === 'number') {
            row.context = model.limit.context;
        }
        if (typeof model.limit?.output === 'number') {
            row.output = model.limit.output;
        }
        return row;
    }
    /** 生成标准表格 */
    generateTable(headers, rows) {
        const separators = headers.map(() => '--------');
        let table = `| ${headers.join(' | ')} |\n`;
        table += `|${separators.join('|')}|\n`;
        for (const row of rows) {
            table += `| ${row.join(' | ')} |\n`;
        }
        return table;
    }
    /** 生成数据浏览器 Markdown */
    generateDataMarkdown(allModelsData, providerIndex, manifest, locale = 'en') {
        const context = this.createDocumentContext(manifest, locale);
        const { tr } = context;
        let markdown = this.generateDocumentHeader(tr('title.data'), tr('intro.data'), context);
        markdown += `**${tr('legend.title')}**: 🧠 ${tr('legend.reasoning')} &nbsp;&nbsp;🔧 ${tr('legend.tools')} &nbsp;&nbsp;📎 ${tr('legend.attachment')} &nbsp;&nbsp;🌡️ ${tr('legend.temperature')}
`;
        // 为每个提供商生成表格
        for (const provider of providerIndex) {
            const providerData = allModelsData.providers[provider.id];
            if (!providerData?.models)
                continue;
            const models = Object.entries(providerData.models);
            if (models.length === 0)
                continue;
            markdown += `## ${provider.name}\n\n`;
            // 添加提供商链接
            const links = [
                providerData.api && `[${tr('link.api')}](${providerData.api})`,
                providerData.doc && `[${tr('link.doc')}](${providerData.doc})`,
            ].filter(Boolean);
            if (links.length > 0) {
                markdown += `${links.join(' | ')}\n\n`;
            }
            // 生成模型表格
            const headers = [
                tr('table.model'),
                tr('table.modelId'),
                tr('table.context'),
                tr('table.output'),
                tr('table.pricing'),
                tr('table.ratios'),
                tr('table.capabilities'),
                tr('table.knowledge'),
                tr('table.modalities'),
                tr('table.details'),
            ];
            const tableRows = models.map(([modelId, model]) => [
                `**${escapeMarkdownPipes(model.name || modelId)}**`,
                escapeMarkdownPipes(modelId),
                formatLimit(model.limit?.context),
                formatLimit(model.limit?.output),
                formatPricing(model.cost),
                this.formatNewApiRatios(this.calculateNewApiRatios(model.cost)),
                formatCapabilities(model),
                model.knowledge || '-',
                formatModalities(model.modalities),
                formatDetails(model),
            ]);
            markdown += this.generateTable(headers, tableRows);
            markdown += '\n';
        }
        return markdown;
    }
    /** 构建所有模型行数据并按时间排序 */
    buildAndSortModelRows(allModelsData) {
        const rows = [];
        for (const [providerId, provider] of Object.entries(allModelsData.providers)) {
            for (const [modelId, model] of Object.entries(provider.models || {})) {
                rows.push(this.buildModelRow(providerId, provider, modelId, model));
            }
        }
        return rows.sort((a, b) => {
            const at = a.releaseTs ?? -Infinity;
            const bt = b.releaseTs ?? -Infinity;
            return bt - at; // 降序（新 → 旧 → 未知）
        });
    }
    /** 按时间段分组模型 */
    groupModelsByTime(rows) {
        const now = Date.now();
        const oneWeekAgo = now - TIME_PERIODS.WEEK_MS;
        const oneMonthAgo = now - TIME_PERIODS.MONTH_MS;
        const threeMonthsAgo = now - TIME_PERIODS.THREE_MONTHS_MS;
        return {
            recent: rows.filter((r) => r.releaseTs && r.releaseTs > oneWeekAgo),
            thisMonth: rows.filter((r) => r.releaseTs && r.releaseTs <= oneWeekAgo && r.releaseTs > oneMonthAgo),
            lastThreeMonths: rows.filter((r) => r.releaseTs && r.releaseTs <= oneMonthAgo && r.releaseTs > threeMonthsAgo),
            older: rows.filter((r) => !r.releaseTs || r.releaseTs <= threeMonthsAgo),
        };
    }
    /** 生成模型卡片组 */
    renderModelCardSection(models, sectionTitle, icon, context) {
        if (models.length === 0)
            return '';
        const { tr, trWith } = context;
        let section = `\n## ${icon} ${sectionTitle}\n\n`;
        section += `<div class="grid cards" markdown>\n\n`;
        for (const model of models.slice(0, DISPLAY_LIMITS.CARDS_PER_SECTION)) {
            section += this.renderModelCard(model, context);
        }
        section += `</div>\n\n`;
        if (models.length > DISPLAY_LIMITS.CARDS_PER_SECTION) {
            section += `!!! note "${tr('note.showing_first')}"\n`;
            section += `    ${trWith('note.total_models', { count: models.length })}\n\n`;
        }
        return section;
    }
    /** 生成单个模型卡片 */
    renderModelCard(model, { tr }) {
        let card = `-   **${escapeMarkdownPipes(model.modelName)}**\n\n`;
        card += `    ---\n\n`;
        card += `    :material-factory: **${escapeMarkdownPipes(model.providerName)}**\n\n`;
        card += `    :material-identifier: \`${escapeMarkdownPipes(model.modelId)}\`\n\n`;
        if (model.releaseRaw) {
            card += `    :material-calendar: **${tr('table.released')}**: ${escapeMarkdownPipes(model.releaseRaw)}\n\n`;
        }
        // 上下文和输出长度
        if (model.context || model.output) {
            const contextInfo = [];
            if (model.context)
                contextInfo.push(`${tr('table.context')}: ${formatLimit(model.context)}`);
            if (model.output)
                contextInfo.push(`${tr('table.output')}: ${formatLimit(model.output)}`);
            card += `    :material-arrow-expand-horizontal: ${contextInfo.join(' / ')}\n\n`;
        }
        const cardFields = [
            {
                condition: model.modalities !== '-',
                icon: ':material-swap-horizontal:',
                label: tr('table.modalities'),
                value: model.modalities,
            },
            { condition: model.pricing !== '-', icon: ':material-currency-usd:', value: model.pricing },
            {
                condition: model.ratios !== '-',
                icon: ':material-calculator:',
                label: 'NewAPI',
                value: model.ratios,
            },
            {
                condition: model.knowledge && model.knowledge !== '-',
                icon: ':material-database:',
                label: tr('table.knowledge'),
                value: escapeMarkdownPipes(model.knowledge),
            },
            { condition: model.capabilities !== '-', value: model.capabilities },
            {
                condition: model.details !== '-',
                icon: ':material-information-outline:',
                value: model.details,
            },
        ];
        for (const field of cardFields) {
            if (field.condition) {
                const prefix = field.icon ? `${field.icon} ` : '';
                const labelPart = field.label ? `**${field.label}**: ` : '';
                card += `    ${prefix}${labelPart}${field.value}\n\n`;
            }
        }
        return card + '\n';
    }
    /** 生成较早发布模型的紧凑表格 */
    renderOlderModelsTable(olderRows, context) {
        const { tr, trWith } = context;
        let section = `\n## :material-archive: ${tr('section.earlier')}\n\n`;
        section += `!!! info "${tr('note.compact_list')}"\n`;
        section += `    ${trWith('note.older_models', { count: olderRows.length })}\n\n`;
        const headers = [
            tr('table.model'),
            tr('table.provider'),
            tr('table.released'),
            tr('table.context'),
            tr('table.output'),
            tr('table.modalities'),
            tr('table.capabilities'),
            tr('table.pricing'),
            tr('table.ratios'),
            tr('table.knowledge'),
            tr('table.details'),
        ];
        const tableRows = olderRows
            .slice(0, DISPLAY_LIMITS.OLDER_MODELS_TABLE)
            .map((r) => [
            `**${escapeMarkdownPipes(r.modelName)}**`,
            escapeMarkdownPipes(r.providerName),
            escapeMarkdownPipes(r.releaseRaw || '-'),
            r.context ? formatLimit(r.context) : '-',
            r.output ? formatLimit(r.output) : '-',
            r.modalities,
            r.capabilities,
            r.pricing,
            r.ratios,
            r.knowledge || '-',
            r.details,
        ]);
        section += this.generateTable(headers, tableRows);
        if (olderRows.length > DISPLAY_LIMITS.OLDER_MODELS_TABLE) {
            section += `\n!!! tip "${tr('note.more_models')}"\n`;
            section += `    ${trWith('note.visit_full_list', {
                count: olderRows.length - DISPLAY_LIMITS.OLDER_MODELS_TABLE,
                title: tr('title.data'),
            })}\n\n`;
        }
        return section;
    }
    /** 生成"最新发布" Markdown（全站按 release_date 降序） */
    generateReleasesMarkdown(allModelsData, manifest, locale = 'en') {
        const context = this.createDocumentContext(manifest, locale);
        const { tr } = context;
        let markdown = this.generateDocumentHeader(tr('title.releases'), tr('intro.releases'), context, ':material-rocket-launch:');
        const rows = this.buildAndSortModelRows(allModelsData);
        const groupedModels = this.groupModelsByTime(rows);
        // 生成各个时间段的模型卡片
        markdown += this.renderModelCardSection(groupedModels.recent, tr('section.this_week'), ':material-new-box:', context);
        markdown += this.renderModelCardSection(groupedModels.thisMonth, tr('section.this_month'), ':material-clock-outline:', context);
        markdown += this.renderModelCardSection(groupedModels.lastThreeMonths, tr('section.last_3_months'), ':material-history:', context);
        // 生成较早发布模型的表格
        if (groupedModels.older.length > 0) {
            markdown += this.renderOlderModelsTable(groupedModels.older, context);
        }
        return markdown;
    }
}
//# sourceMappingURL=docs-generator.js.map