import type {
  BuildManifest,
  NewApiRatios,
  NormalizedData,
  ProviderIndexItem,
} from '../types/index.js';
import { I18nService } from './i18n-service.js';
import {
  escapeMarkdownPipes,
  formatCapabilities,
  formatDetails,
  formatLimit,
  formatModalities,
  formatPricing,
} from '../utils/format-utils.js';

/** 文档生成服务 */
export class DocumentationGenerator {
  private readonly i18n: I18nService;
  constructor(rootDir: string) {
    this.i18n = new I18nService(rootDir);
  }

  /** 将 YYYY 或 YYYY-MM 或 YYYY-MM-DD 字符串解析为时间戳（不可解析返回 null） */
  private parseDateToTimestamp(dateStr?: string): number | null {
    if (!dateStr || typeof dateStr !== 'string') return null;
    // 规范化为完整日期，优先使用原字符串可被 Date 解析
    const direct = Date.parse(dateStr);
    if (!Number.isNaN(direct)) return direct;
    // 补全到月初/日：支持 "YYYY"、"YYYY-MM"
    if (/^\d{4}$/.test(dateStr)) {
      const ts = Date.parse(`${dateStr}-01-01`);
      return Number.isNaN(ts) ? null : ts;
    }
    if (/^\d{4}-\d{2}$/.test(dateStr)) {
      const ts = Date.parse(`${dateStr}-01`);
      return Number.isNaN(ts) ? null : ts;
    }
    return null;
  }

  /** 计算 NewAPI 比率（文档用） */
  private calculateNewApiRatios(cost?: {
    input?: number;
    output?: number;
    cache_read?: number;
    cache_write?: number;
  }): NewApiRatios | null {
    if (!cost?.input || typeof cost.input !== 'number' || cost.input <= 0) {
      return null;
    }

    const ratios: NewApiRatios = {
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
  private formatNewApiRatios(ratios: NewApiRatios | null): string {
    if (!ratios) return '-';

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
  generateDataMarkdown(
    allModelsData: NormalizedData,
    providerIndex: ProviderIndexItem[],
    manifest: BuildManifest,
    locale: string = 'en',
  ): string {
    const { stats } = manifest;
    const lastUpdated = new Date(manifest.generatedAt).toLocaleString(
      this.i18n.getDateLocale(locale),
      { timeZone: this.i18n.getTimeZone(locale) },
    );

    const messages = this.i18n.getDocMessages(locale);
    const tr = (key: string): string => messages[key] || key;

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

**${tr('legend.title')}**: 🧠 ${tr('legend.reasoning')} &nbsp;&nbsp;🔧 ${tr(
      'legend.tools',
    )} &nbsp;&nbsp;📎 ${tr('legend.attachment')} &nbsp;&nbsp;🌡️ ${tr('legend.temperature')}
`;

    // 为每个提供商生成 Markdown 表格
    providerIndex.forEach((provider) => {
      const providerData = allModelsData.providers[provider.id];
      if (!providerData?.models) return;

      const models = Object.entries(providerData.models);
      if (models.length === 0) return;

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

  /** 生成"最新发布" Markdown（全站按 release_date 降序） */
  generateReleasesMarkdown(
    allModelsData: NormalizedData,
    manifest: BuildManifest,
    locale: string = 'en',
  ): string {
    const { stats } = manifest;
    const lastUpdated = new Date(manifest.generatedAt).toLocaleString(
      this.i18n.getDateLocale(locale),
      { timeZone: this.i18n.getTimeZone(locale) },
    );

    const messages = this.i18n.getDocMessages(locale);
    const tr = (key: string): string => messages[key] || key;
    const trWith = (key: string, vars: Record<string, string | number>): string => {
      let text = messages[key] || key;
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
      return text;
    };

    let markdown = `---
hide:
  - navigation
  - toc
---

# :material-rocket-launch: ${tr('title.releases')}

${tr('intro.releases')}

!!! tip "📊 ${tr('stats.title')}"
    **${tr('stats.providers')}**: ${stats.providers} &nbsp;&nbsp;
    **${tr('stats.models')}**: ${stats.models} &nbsp;&nbsp;
    **${tr('stats.updated')}**: ${lastUpdated}

`;

    type Row = {
      providerId: string;
      providerName: string;
      modelId: string;
      modelName: string;
      releaseRaw?: string | undefined;
      releaseTs: number | null;
      context?: number;
      output?: number;
      pricing: string;
      ratios: string;
      capabilities: string;
      knowledge?: string | undefined;
      modalities: string;
      details: string;
    };

    const rows: Row[] = [];
    for (const [providerId, provider] of Object.entries(allModelsData.providers)) {
      const providerName = provider.name || providerId;
      for (const [modelId, model] of Object.entries(provider.models || {})) {
        const releaseRaw = model.release_date || undefined;
        const releaseTs = this.parseDateToTimestamp(releaseRaw);
        const row: Row = {
          providerId,
          providerName,
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
        rows.push(row);
      }
    }

    rows.sort((a, b) => {
      const at = a.releaseTs ?? -Infinity;
      const bt = b.releaseTs ?? -Infinity;
      return bt - at; // 降序（新 → 旧 → 未知）
    });

    // 按时间段分组
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
    const threeMonthsAgo = now - 90 * 24 * 60 * 60 * 1000;

    const recentRows = rows.filter(r => r.releaseTs && r.releaseTs > oneWeekAgo);
    const thisMonthRows = rows.filter(r => r.releaseTs && r.releaseTs <= oneWeekAgo && r.releaseTs > oneMonthAgo);
    const lastThreeMonthRows = rows.filter(r => r.releaseTs && r.releaseTs <= oneMonthAgo && r.releaseTs > threeMonthsAgo);
    const olderRows = rows.filter(r => !r.releaseTs || r.releaseTs <= threeMonthsAgo);

    const renderModelCards = (models: Row[], sectionTitle: string, icon: string) => {
      if (models.length === 0) return '';

      let section = `\n## ${icon} ${sectionTitle}\n\n`;

      // 使用网格布局展示模型卡片
      section += `<div class="grid cards" markdown>\n\n`;

      for (const model of models.slice(0, 20)) { // 限制每个分组最多20个
        section += `-   **${escapeMarkdownPipes(model.modelName)}**\n\n`;
        section += `    ---\n\n`;
        section += `    :material-factory: **${escapeMarkdownPipes(model.providerName)}**\n\n`;
        section += `    :material-identifier: \`${escapeMarkdownPipes(model.modelId)}\`\n\n`;
        if (model.releaseRaw) {
          section += `    :material-calendar: ${escapeMarkdownPipes(model.releaseRaw)}\n\n`;
        }
        if (model.pricing !== '-') {
          section += `    :material-currency-usd: ${model.pricing}\n\n`;
        }
        if (model.capabilities !== '-') {
          section += `    ${model.capabilities}\n\n`;
        }
        section += `\n`;
      }

      section += `</div>\n\n`;

      if (models.length > 20) {
        section += `!!! note "${tr('note.showing_first')}"\n`;
        section += `    ${trWith('note.total_models', { count: models.length })}\n\n`;
      }

      return section;
    };

    // 生成各个时间段的模型卡片
    markdown += renderModelCards(recentRows, tr('section.this_week'), ':material-new-box:');
    markdown += renderModelCards(thisMonthRows, tr('section.this_month'), ':material-clock-outline:');
    markdown += renderModelCards(lastThreeMonthRows, tr('section.last_3_months'), ':material-history:');

    // 对于更老的模型，使用紧凑的表格格式
    if (olderRows.length > 0) {
      markdown += `\n## :material-archive: ${tr('section.earlier')}\n\n`;
      markdown += `!!! info "${tr('note.compact_list')}"\n`;
      markdown += `    ${trWith('note.older_models', { count: olderRows.length })}\n\n`;

      const headers = [
        tr('table.model'),
        tr('table.provider'),
        tr('table.released'),
        tr('table.capabilities'),
        tr('table.pricing'),
      ];
      const separators = ['-------', '--------', '--------', '--------------', '----------------'];

      markdown += `| ${headers.join(' | ')} |\n`;
      markdown += `|${separators.join('|')}|\n`;

      for (const r of olderRows.slice(0, 50)) { // 限制较老模型最多50个
        const fields = [
          `**${escapeMarkdownPipes(r.modelName)}**`,
          escapeMarkdownPipes(r.providerName),
          escapeMarkdownPipes(r.releaseRaw || '-'),
          r.capabilities,
          r.pricing,
        ];
        markdown += `| ${fields.join(' | ')} |\n`;
      }

      if (olderRows.length > 50) {
        markdown += `\n!!! tip "${tr('note.more_models')}"\n`;
        markdown += `    ${trWith('note.visit_full_list', { count: olderRows.length - 50, title: tr('title.data') })}\n\n`;
      }
    }

    return markdown;
  }
}
