import type {
  BuildManifest,
  NewApiRatios,
  NormalizedData,
  ProviderIndexItem,
} from '../types/index.js';
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
  constructor(_rootDir: string) {
    // rootDir 保留以备将来使用
  }

  /** 计算 NewAPI 比率（文档用） */
  private calculateNewApiRatios(cost?: {
    input?: number;
    output?: number;
    cache_read?: number;
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
  ): string {
    const { stats } = manifest;
    const lastUpdated = new Date(manifest.generatedAt).toLocaleString('en-US');

    let markdown = `---
hide:
  - navigation
---

# Data Browser

This page displays comprehensive information about all LLM providers and models, automatically generated from API data.

!!! info "Statistics"
    - **Provider Count**: ${stats.providers}
    - **Model Count**: ${stats.models}
    - **Last Updated**: ${lastUpdated}

**Capabilities Legend**: 🧠 Reasoning &nbsp;&nbsp;🔧 Tools &nbsp;&nbsp;📎 Files &nbsp;&nbsp;🌡️ Temperature

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
        providerData.api && `[📖 API Address](${providerData.api})`,
        providerData.doc && `[📚 Official Documentation](${providerData.doc})`,
      ].filter(Boolean);

      if (links.length > 0) {
        markdown += `${links.join(' | ')}\n\n`;
      }

      // 生成综合模型表格
      const headers = [
        'Model',
        'Model ID',
        'Context',
        'Output',
        'Pricing ($/1M)',
        'NewAPI Ratios',
        'Capabilities',
        'Knowledge',
        'Modalities',
        'Details',
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
