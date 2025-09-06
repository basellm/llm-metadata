import { I18nService } from './i18n-service.js';
import { escapeMarkdownPipes, formatCapabilities, formatDetails, formatLimit, formatModalities, formatPricing, } from '../utils/format-utils.js';
/** 文档生成服务 */
export class DocumentationGenerator {
    i18n;
    constructor(rootDir) {
        this.i18n = new I18nService(rootDir);
    }
    /** 计算 NewAPI 比率（文档用） */
    calculateNewApiRatios(cost) {
        if (!cost?.input || typeof cost.input !== 'number' || cost.input <= 0) {
            return null;
        }
        const ratios = {
            model: cost.input / 2, // 基准: $2 per 1M tokens
            completion: null,
            cache: null,
        };
        if (typeof cost.output === 'number' && cost.output > 0) {
            ratios.completion = cost.output / cost.input;
        }
        if (typeof cost.cache_read === 'number' && cost.cache_read > 0) {
            ratios.cache = cost.cache_read / cost.input;
        }
        return ratios;
    }
    /** 格式化 NewAPI 比率显示 */
    formatNewApiRatios(ratios) {
        if (!ratios)
            return '-';
        const parts = [];
        parts.push(`Model: ${ratios.model.toFixed(3)}`);
        if (ratios.completion !== null) {
            parts.push(`Completion: ${ratios.completion.toFixed(3)}`);
        }
        if (ratios.cache !== null) {
            parts.push(`Cache: ${ratios.cache.toFixed(3)}`);
        }
        return parts.join('<br/>');
    }
    /** 生成数据浏览器 Markdown */
    generateDataMarkdown(allModelsData, providerIndex, manifest, locale = 'en') {
        const { stats } = manifest;
        const lastUpdated = new Date(manifest.generatedAt).toLocaleString(this.i18n.getDateLocale(locale), { timeZone: this.i18n.getTimeZone(locale) });
        const messages = this.i18n.getDocMessages(locale);
        const tr = (key) => messages[key] || key;
        let markdown = `---
hide:
  - navigation
---

# ${tr('title.data')}

${tr('intro.data')}

!!! info "${tr('stats.title')}"
    - **${tr('stats.providers')}**: ${stats.providers}
    - **${tr('stats.models')}**: ${stats.models}
    - **${tr('stats.updated')}**: ${lastUpdated}

**${tr('legend.title')}**: 🧠 ${tr('legend.reasoning')} &nbsp;&nbsp;🔧 ${tr('legend.tools')} &nbsp;&nbsp;📎 ${tr('legend.attachment')} &nbsp;&nbsp;🌡️ ${tr('legend.temperature')}
`;
        // 为每个提供商生成 Markdown 表格
        providerIndex.forEach((provider) => {
            const providerData = allModelsData.providers[provider.id];
            if (!providerData?.models)
                return;
            const models = Object.entries(providerData.models);
            if (models.length === 0)
                return;
            markdown += `## ${provider.name}\n\n`;
            // 添加提供商链接
            const links = [
                providerData.api && `[${tr('link.api')}](${providerData.api})`,
                providerData.doc && `[${tr('link.doc')}](${providerData.doc})`,
            ].filter(Boolean);
            if (links.length > 0) {
                markdown += `${links.join(' | ')}\n\n`;
            }
            // 生成综合模型表格
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
            const separators = [
                '-------',
                '--------',
                '---------',
                '--------',
                '----------------',
                '---------------',
                '--------------',
                '-----------',
                '------------',
                '----------',
            ];
            markdown += `| ${headers.join(' | ')} |\n`;
            markdown += `|${separators.join('|')}|\n`;
            models.forEach(([modelId, model]) => {
                const fields = [
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
                ];
                markdown += `| ${fields.join(' | ')} |\n`;
            });
            markdown += '\n';
        });
        return markdown;
    }
}
//# sourceMappingURL=docs-generator.js.map