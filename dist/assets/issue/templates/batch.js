/**
 * Batch Template Data
 * Example template for batch submissions
 */

export const batchTemplate = [
  {
    schema: 'provider-submission',
    action: 'create',
    id: 'newprovider',
    api: 'https://api.newprovider.com/docs',
    lobeIcon: 'NewProvider.Color',
    i18n: {
      name: { en: 'New Provider', zh: '新提供商', ja: '新プロバイダー' },
      description: {
        en: 'Example new provider for demonstration.',
        zh: '用于演示的示例新提供商。',
        ja: 'デモ用の新プロバイダー例。',
      },
    },
  },
  {
    schema: 'model-submission',
    action: 'create',
    providerId: 'examplecorp',
    id: 'novus-1',
    i18n: {
      name: { en: 'Novus 1', zh: 'Novus 1', ja: 'Novus 1' },
      description: {
        en: 'Fictional example multimodal model.',
        zh: '虚构示例多模态模型。',
        ja: '架空のマルチモーダルモデル例。',
      },
    },
    reasoning: true,
    tool_call: true,
    attachment: true,
    temperature: true,
    knowledge: '2024-07',
    release_date: '2025-01-20',
    last_updated: '2025-08-21',
    open_weights: false,
    modalities: {
      input: ['text', 'image', 'audio', 'video', 'pdf'],
      output: ['text', 'image', 'audio', 'video', 'pdf'],
    },
    limit: { context: 128000, output: 4096 },
    cost: { input: 5, output: 15, cache_read: 0.075, cache_write: 0.5 },
  },
  {
    schema: 'provider-submission',
    action: 'update',
    id: 'deepseek',
    i18n: {
      name: { en: 'DeepSeek', zh: 'DeepSeek', ja: 'DeepSeek' },
      description: {
        en: 'Advanced AI research company.',
        zh: '先进的AI研究公司。',
        ja: '先進的なAI研究会社。',
      },
    },
  },
];
