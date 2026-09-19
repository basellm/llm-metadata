import {
  Fragment,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type Locale = 'en' | 'zh' | 'ja';

const PLACEHOLDER_RE = /(\{\w+\})/;

/**
 * 把消息中的 {name} 占位符替换为 React 节点（链接、动效数字等）；纯文本参数请直接用 t()。
 * 未提供的占位符按原文保留。
 */
export function renderMessage(template: string, params: Record<string, ReactNode>): ReactNode {
  return template.split(PLACEHOLDER_RE).map((part, index) => {
    const name = part.startsWith('{') && part.endsWith('}') ? part.slice(1, -1) : null;
    return <Fragment key={index}>{name !== null && name in params ? params[name] : part}</Fragment>;
  });
}

export const LOCALES: ReadonlyArray<{ value: Locale; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
];

const en = {
  'app.tagline': 'Native provider pricing',
  'app.stats': '{providers} providers · {models} models',
  'app.github': 'GitHub repository',
  'app.selectProvider': 'Select provider',
  'app.docs': 'Docs',
  'app.searchModels': 'Search models…',
  'app.retry': 'Retry',
  'app.tableFootnote':
    "{count} models · Prices per 1M tokens in the provider's billing currency · Expand a row for tier details.",
  'app.cardsFootnote':
    "{count} models · Prices per 1M tokens in the provider's billing currency · Open a card for tier details.",
  'app.footerSource': 'Data from {link} and community overrides · Native providers only',
  'app.updated': 'Updated {date}',
  'app.apiDocs': 'API documentation',
  'app.billingCurrency': 'This endpoint bills in {currency}',
  'theme.toggle': 'Toggle theme',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'theme.system': 'System',
  'locale.change': 'Change language',
  'view.table': 'Table view',
  'view.cards': 'Card view',
  'card.inputTypes': 'Input types',
  'card.outputTypes': 'Output types',
  'sidebar.filter': 'Filter providers or models…',
  'sidebar.title': 'Providers',
  'sidebar.empty': 'No providers.',
  'sidebar.models': 'Models',
  'sidebar.modelsError': 'Failed to load the model index.',
  'sidebar.moreResults': '{count} more · refine your search',
  'table.model': 'Model',
  'table.released': 'Released',
  'table.context': 'Context',
  'table.input': 'Input',
  'table.cacheRead': 'Cache read',
  'table.cacheWrite': 'Cache write',
  'table.output': 'Output',
  'table.new': 'New',
  'table.newHint': 'Released within the last {days} days',
  'table.tiered': 'Tiered',
  'table.thinking': 'Thinking',
  'table.timeBased': 'Time-based',
  'table.deprecated': 'Deprecated',
  'table.beta': 'Beta',
  'table.estimated': '≈ USD',
  'table.estimatedHint':
    'Upstream figure in USD — this endpoint bills in {currency} and no official {currency} price has been recorded yet',
  'table.empty': 'No models match your search.',
  'table.expr': 'new-api billing expression',
  'table.expand': 'Expand pricing details for {model}',
  'table.collapse': 'Collapse pricing details for {model}',
  'table.viewDetails': 'View details for {model}',
  'detail.back': 'Models',
  'detail.price': 'Price',
  'detail.maxOutputShort': 'Max output',
  'detail.tokens': 'tokens',
  'detail.pricing': 'Pricing',
  'detail.textTokens': 'Text tokens',
  'detail.per1m': 'Per 1M tokens',
  'detail.modalities': 'Modalities',
  'detail.features': 'Features',
  'detail.image': 'Image',
  'detail.video': 'Video',
  'detail.inputAndOutput': 'Input and output',
  'detail.inputOnly': 'Input only',
  'detail.outputOnly': 'Output only',
  'detail.supported': 'Supported',
  'detail.notSupported': 'Not supported',
  'detail.reasoning': 'Reasoning',
  'detail.toolCall': 'Function calling',
  'detail.structuredOutput': 'Structured outputs',
  'detail.attachment': 'File attachments',
  'detail.temperature': 'Temperature control',
  'detail.openWeights': 'Open weights',
  'detail.contextWindow': 'Context window',
  'detail.maxInput': 'Max input tokens',
  'detail.maxOutput': 'Max output tokens',
  'detail.knowledge': 'Knowledge cutoff',
  'detail.release': 'Release date',
  'detail.updated': 'Last updated',
  'detail.reasoningEffort': 'Reasoning effort levels',
  'detail.family': 'Model family',
  'detail.priceList': '{currency} price list',
  'detail.priceListHint': 'Official list for the same endpoint · not a conversion',
  'detail.otherEndpoints': 'Other endpoints',
  'detail.otherEndpointsHint':
    'The same model ID on other native endpoints (regional variants), each in its own billing currency.',
  'detail.otherEndpointsError': 'Failed to load other endpoints.',
  'copy.copy': 'Copy to clipboard',
  'copy.copied': 'Copied',
  'expr.unit': 'quota USD / 1M tokens · 1 quota USD = {display}',
  'expr.sheet': 'from the {currency} price list',
  'newapi.title': 'new-api billing settings',
  'newapi.close': 'Close',
  'newapi.customized': 'Custom new-api deployment active',
  'newapi.description':
    'Expression coefficients are denominated in your deployment\u2019s quota USD. Enter the values from new-api \u2192 Settings \u2192 Pricing & Display, or paste the response of the public /api/status endpoint. Expressions on this site update immediately.',
  'newapi.importTitle': 'Import from a new-api site',
  'newapi.importPlaceholder':
    'Paste the JSON returned by https://your-new-api.example.com/api/status',
  'newapi.importHint':
    'new-api does not serve /api/status cross-origin, so this page cannot fetch it. Open that URL in a new tab, copy the whole response and paste it here \u2014 quota_display_type, exchange rates and currency settings are filled in automatically.',
  'newapi.imported': 'Imported the settings of {source}',
  'newapi.importInvalid':
    'Not a /api/status response \u2014 paste the complete JSON shown in the browser.',
  'newapi.displayType': 'Quota display type',
  'newapi.displayTypeHint':
    'new-api quota_display_type; "Tokens only" behaves like USD for billing.',
  'newapi.type.USD': 'USD ($)',
  'newapi.type.CNY': 'CNY (\u00a5)',
  'newapi.type.CUSTOM': 'Custom currency',
  'newapi.usdExchangeRate': 'CNY per quota USD',
  'newapi.usdExchangeRateHint':
    'new-api USDExchangeRate: how 1 quota USD is shown in CNY (7.3 by default; 1 on sites that sell quota 1:1 as CNY).',
  'newapi.usdExchangeRateReal': 'CNY per USD',
  'newapi.usdExchangeRateRealHint':
    'new-api USDExchangeRate: the real CNY↔USD rate, used to convert official CNY price lists into quota USD.',
  'newapi.customSymbol': 'Currency symbol',
  'newapi.customRate': 'Units per quota USD',
  'newapi.customRateHint': 'new-api custom_currency_exchange_rate.',
  'newapi.settlementRate': 'USD settlement rate',
  'newapi.settlementRateHint':
    'new-api USDSettlementRate: display-currency units per real US dollar. Leave empty when 1 quota USD is a real dollar.',
  'newapi.settlementUnset': 'unset',
  'newapi.preferredList': 'Preferred price list',
  'newapi.preferredListHint':
    'When a model publishes several official lists (e.g. DeepSeek in USD and CNY), use this currency where available.',
  'newapi.summary': 'Coefficients are quota USD per 1M tokens \u00b7 1 quota USD = {display}',
  'newapi.summaryInvalid': 'Fix the highlighted fields to preview the coefficient unit.',
  'newapi.unaffected':
    'QuotaPerUnit and group ratios are applied by new-api after the expression and need no configuration here.',
  'newapi.exportAll': 'Download ratio_config for all providers',
  'newapi.exporting': 'Preparing\u2026',
  'newapi.exportFailed': 'Export failed \u2014 retry',
  'newapi.reset': 'Restore defaults',
  'newapi.save': 'Save',
  'newapi.copyProvider': 'Copy ratio_config',
  'newapi.mustBePositive': 'Must be greater than 0',
  'newapi.mustBeNonNegative': 'Must be 0 or greater',
  'newapi.symbolRequired': 'Symbol required',
  'pricing.estimatedNote':
    'Prices shown are upstream USD figures; this endpoint bills in {currency}.',
  'pricing.timeBased': 'Time-based pricing',
  'pricing.otherTimes': 'All other times',
  'pricing.now': 'Now',
  'pricing.contextPricing': 'Context pricing',
  'pricing.thinkingMode': 'Thinking mode',
  'pricing.modalityRates': 'Modality rates',
  'pricing.unitPricing': 'Unit pricing',
  'pricing.base': 'Base',
  'pricing.text': 'Text',
  'pricing.vision': 'Vision',
  'pricing.audio': 'Audio',
  'pricing.textOutputMultimodal': 'Text output · multimodal input',
  'pricing.textOutputTextOnly': 'Text output · text-only input',
  'pricing.multimodalOutput': 'Multimodal output',
  'pricing.embeddingText': 'Embedding · text',
  'pricing.embeddingImage': 'Embedding · image',
  'pricing.reasoningMode': 'Reasoning mode',
  'pricing.per10kChars': 'Per 10K characters',
  'pricing.perImage': 'Per image',
  'pricing.perSecond': 'Per second',
  'pricing.perSecondVariant': 'Per second · {variant}',
  'pricing.suffixPerSecond': '/s',
  'pricing.suffixPer10kChars': '/10K chars',
  'pricing.suffixPerImage': '/image',
} as const;

export type MessageKey = keyof typeof en;
type Messages = Record<MessageKey, string>;

const zh: Messages = {
  'app.tagline': '原生供应商价格',
  'app.stats': '{providers} 家供应商 · {models} 个模型',
  'app.github': 'GitHub 仓库',
  'app.selectProvider': '选择供应商',
  'app.docs': '文档',
  'app.searchModels': '搜索模型…',
  'app.retry': '重试',
  'app.tableFootnote':
    '{count} 个模型 · 价格按每 100 万 tokens 计（供应商结算货币） · 点击行可展开阶梯明细。',
  'app.cardsFootnote':
    '{count} 个模型 · 价格按每 100 万 tokens 计（供应商结算货币） · 点击卡片查看阶梯明细。',
  'app.footerSource': '数据来自 {link} 与社区覆写 · 仅收录原生供应商',
  'app.updated': '更新于 {date}',
  'app.apiDocs': 'API 文档',
  'app.billingCurrency': '该端点以 {currency} 结算',
  'theme.toggle': '切换主题',
  'theme.light': '浅色',
  'theme.dark': '深色',
  'theme.system': '跟随系统',
  'locale.change': '切换语言',
  'view.table': '表格视图',
  'view.cards': '卡片视图',
  'card.inputTypes': '输入类型',
  'card.outputTypes': '输出类型',
  'sidebar.filter': '筛选供应商或模型…',
  'sidebar.title': '供应商',
  'sidebar.empty': '没有匹配的供应商。',
  'sidebar.models': '模型',
  'sidebar.modelsError': '模型索引加载失败。',
  'sidebar.moreResults': '还有 {count} 个结果 · 请缩小搜索范围',
  'table.model': '模型',
  'table.released': '发布',
  'table.context': '上下文',
  'table.input': '输入',
  'table.cacheRead': '缓存读',
  'table.cacheWrite': '缓存写',
  'table.output': '输出',
  'table.new': '新',
  'table.newHint': '{days} 天内发布',
  'table.tiered': '阶梯',
  'table.thinking': '思考',
  'table.timeBased': '分时段',
  'table.deprecated': '已弃用',
  'table.beta': '测试版',
  'table.estimated': '≈ USD',
  'table.estimatedHint': '上游美元数值——该端点以 {currency} 结算，尚未录入官方 {currency} 价格',
  'table.empty': '没有匹配的模型。',
  'table.expr': 'new-api 计费表达式',
  'table.expand': '展开 {model} 的价格明细',
  'table.collapse': '收起 {model} 的价格明细',
  'table.viewDetails': '查看 {model} 的详情',
  'detail.back': '模型列表',
  'detail.price': '价格',
  'detail.maxOutputShort': '最大输出',
  'detail.tokens': 'tokens',
  'detail.pricing': '价格',
  'detail.textTokens': '文本 tokens',
  'detail.per1m': '每 100 万 tokens',
  'detail.modalities': '模态',
  'detail.features': '能力',
  'detail.image': '图像',
  'detail.video': '视频',
  'detail.inputAndOutput': '输入和输出',
  'detail.inputOnly': '仅输入',
  'detail.outputOnly': '仅输出',
  'detail.supported': '支持',
  'detail.notSupported': '不支持',
  'detail.reasoning': '推理',
  'detail.toolCall': '函数调用',
  'detail.structuredOutput': '结构化输出',
  'detail.attachment': '文件附件',
  'detail.temperature': '温度参数',
  'detail.openWeights': '开放权重',
  'detail.contextWindow': '上下文窗口',
  'detail.maxInput': '最大输入 tokens',
  'detail.maxOutput': '最大输出 tokens',
  'detail.knowledge': '知识截止',
  'detail.release': '发布日期',
  'detail.updated': '最近更新',
  'detail.reasoningEffort': '推理强度档位',
  'detail.family': '模型系列',
  'detail.priceList': '{currency} 官方价目',
  'detail.priceListHint': '同一端点的官方价目 · 非汇率换算',
  'detail.otherEndpoints': '其他端点',
  'detail.otherEndpointsHint':
    '同一模型 ID 在其他原生端点（国内 / 国际版本）的价格，各按其结算货币展示。',
  'detail.otherEndpointsError': '其他端点加载失败。',
  'copy.copy': '复制',
  'copy.copied': '已复制',
  'expr.unit': '额度美元 / 1M tokens · 1 额度美元 = {display}',
  'expr.sheet': '采用 {currency} 官方价目',
  'newapi.title': 'new-api 计费配置',
  'newapi.close': '关闭',
  'newapi.customized': '已启用自定义 new-api 部署配置',
  'newapi.description':
    '表达式系数以你的 new-api 部署的「额度美元」计价。填写 new-api → 设置 → 定价与展示 中的同名设置，或粘贴公开接口 /api/status 的返回内容导入；本站表达式随即按该配置生成。',
  'newapi.importTitle': '从 new-api 站点导入',
  'newapi.importPlaceholder': '粘贴 https://你的站点/api/status 返回的 JSON',
  'newapi.importHint':
    'new-api 未对 /api/status 开放跨域访问，本页无法直接读取。请在新标签页打开该地址，复制全部返回内容粘贴到此处，quota_display_type、汇率与货币设置会自动填入。',
  'newapi.imported': '已导入 {source} 的设置',
  'newapi.importInvalid': '不是 /api/status 的返回内容，请粘贴浏览器中显示的完整 JSON。',
  'newapi.displayType': '额度展示类型',
  'newapi.displayTypeHint': 'new-api 的 quota_display_type；「仅 Tokens」在计费上等同 USD。',
  'newapi.type.USD': '美元 ($)',
  'newapi.type.CNY': '人民币 (¥)',
  'newapi.type.CUSTOM': '自定义货币',
  'newapi.usdExchangeRate': '1 额度美元 = ? 人民币',
  'newapi.usdExchangeRateHint':
    'new-api 的 USDExchangeRate：1 额度美元显示为多少人民币（默认 7.3；按 1:1 以人民币售卖额度的站点为 1）。',
  'newapi.usdExchangeRateReal': '1 美元 = ? 人民币',
  'newapi.usdExchangeRateRealHint':
    'new-api 的 USDExchangeRate：真实的美元/人民币汇率，用于把官方人民币价目折算为额度美元。',
  'newapi.customSymbol': '货币符号',
  'newapi.customRate': '1 额度美元 = ? 自定义货币',
  'newapi.customRateHint': 'new-api 的 custom_currency_exchange_rate。',
  'newapi.settlementRate': '美元结算汇率',
  'newapi.settlementRateHint':
    'new-api 的 USDSettlementRate：1 真实美元值多少展示货币。额度美元就是真实美元时留空。',
  'newapi.settlementUnset': '未设置',
  'newapi.preferredList': '优先采用的价目货币',
  'newapi.preferredListHint':
    '模型同时公布多份官方价目时（如 DeepSeek 的美元与人民币价），有该货币价目就优先采用。',
  'newapi.summary': '系数单位：额度美元 / 1M tokens · 1 额度美元 = {display}',
  'newapi.summaryInvalid': '请先修正标红的字段以预览系数单位。',
  'newapi.unaffected': 'QuotaPerUnit 与分组倍率由 new-api 在表达式之后应用，此处无需配置。',
  'newapi.exportAll': '下载全部供应商的 ratio_config',
  'newapi.exporting': '正在生成…',
  'newapi.exportFailed': '导出失败，请重试',
  'newapi.reset': '恢复默认',
  'newapi.save': '保存',
  'newapi.copyProvider': '复制 ratio_config',
  'newapi.mustBePositive': '必须大于 0',
  'newapi.mustBeNonNegative': '必须大于等于 0',
  'newapi.symbolRequired': '请填写货币符号',
  'pricing.estimatedNote': '所示价格为上游美元数值；该端点实际以 {currency} 结算。',
  'pricing.timeBased': '分时段定价',
  'pricing.otherTimes': '其余时段',
  'pricing.now': '当前',
  'pricing.contextPricing': '上下文阶梯价',
  'pricing.thinkingMode': '思考模式',
  'pricing.modalityRates': '模态费率',
  'pricing.unitPricing': '按量计价',
  'pricing.base': '基础',
  'pricing.text': '文本',
  'pricing.vision': '视觉',
  'pricing.audio': '音频',
  'pricing.textOutputMultimodal': '文本输出 · 多模态输入',
  'pricing.textOutputTextOnly': '文本输出 · 纯文本输入',
  'pricing.multimodalOutput': '多模态输出',
  'pricing.embeddingText': '嵌入 · 文本',
  'pricing.embeddingImage': '嵌入 · 图像',
  'pricing.reasoningMode': '推理模式',
  'pricing.per10kChars': '每 1 万字符',
  'pricing.perImage': '每张图像',
  'pricing.perSecond': '每秒',
  'pricing.perSecondVariant': '每秒 · {variant}',
  'pricing.suffixPerSecond': '/秒',
  'pricing.suffixPer10kChars': '/1 万字符',
  'pricing.suffixPerImage': '/图',
};

const ja: Messages = {
  'app.tagline': 'ネイティブプロバイダー価格',
  'app.stats': '{providers} プロバイダー · {models} モデル',
  'app.github': 'GitHub リポジトリ',
  'app.selectProvider': 'プロバイダーを選択',
  'app.docs': 'ドキュメント',
  'app.searchModels': 'モデルを検索…',
  'app.retry': '再試行',
  'app.tableFootnote':
    '{count} モデル · 価格は 100 万トークンあたり（プロバイダーの請求通貨） · 行を展開すると段階詳細を表示します。',
  'app.cardsFootnote':
    '{count} モデル · 価格は 100 万トークンあたり（プロバイダーの請求通貨） · カードを開くと段階詳細を表示します。',
  'app.footerSource': 'データは {link} とコミュニティの上書きに基づく · ネイティブプロバイダーのみ',
  'app.updated': '更新日 {date}',
  'app.apiDocs': 'API ドキュメント',
  'app.billingCurrency': 'このエンドポイントは {currency} で請求されます',
  'theme.toggle': 'テーマを切り替え',
  'theme.light': 'ライト',
  'theme.dark': 'ダーク',
  'theme.system': 'システム',
  'locale.change': '言語を変更',
  'view.table': 'テーブル表示',
  'view.cards': 'カード表示',
  'card.inputTypes': '入力タイプ',
  'card.outputTypes': '出力タイプ',
  'sidebar.filter': 'プロバイダーやモデルを絞り込む…',
  'sidebar.title': 'プロバイダー',
  'sidebar.empty': '該当するプロバイダーがありません。',
  'sidebar.models': 'モデル',
  'sidebar.modelsError': 'モデル索引の読み込みに失敗しました。',
  'sidebar.moreResults': 'ほか {count} 件 · 検索条件を絞ってください',
  'table.model': 'モデル',
  'table.released': 'リリース',
  'table.context': 'コンテキスト',
  'table.input': '入力',
  'table.cacheRead': 'キャッシュ読取',
  'table.cacheWrite': 'キャッシュ書込',
  'table.output': '出力',
  'table.new': '新着',
  'table.newHint': '{days} 日以内にリリース',
  'table.tiered': '段階',
  'table.thinking': '思考',
  'table.timeBased': '時間帯別',
  'table.deprecated': '非推奨',
  'table.beta': 'ベータ',
  'table.estimated': '≈ USD',
  'table.estimatedHint':
    '上流の USD 値 — このエンドポイントは {currency} で請求されますが、公式の {currency} 価格は未登録です',
  'table.empty': '検索に一致するモデルがありません。',
  'table.expr': 'new-api 課金式',
  'table.expand': '{model} の価格詳細を展開',
  'table.collapse': '{model} の価格詳細を折りたたむ',
  'table.viewDetails': '{model} の詳細を表示',
  'detail.back': 'モデル一覧',
  'detail.price': '価格',
  'detail.maxOutputShort': '最大出力',
  'detail.tokens': 'トークン',
  'detail.pricing': '料金',
  'detail.textTokens': 'テキストトークン',
  'detail.per1m': '100 万トークンあたり',
  'detail.modalities': 'モダリティ',
  'detail.features': '機能',
  'detail.image': '画像',
  'detail.video': '動画',
  'detail.inputAndOutput': '入力と出力',
  'detail.inputOnly': '入力のみ',
  'detail.outputOnly': '出力のみ',
  'detail.supported': '対応',
  'detail.notSupported': '非対応',
  'detail.reasoning': '推論',
  'detail.toolCall': '関数呼び出し',
  'detail.structuredOutput': '構造化出力',
  'detail.attachment': 'ファイル添付',
  'detail.temperature': '温度調整',
  'detail.openWeights': 'オープンウェイト',
  'detail.contextWindow': 'コンテキストウィンドウ',
  'detail.maxInput': '最大入力トークン',
  'detail.maxOutput': '最大出力トークン',
  'detail.knowledge': '知識カットオフ',
  'detail.release': 'リリース日',
  'detail.updated': '最終更新',
  'detail.reasoningEffort': '推論強度レベル',
  'detail.family': 'モデルファミリー',
  'detail.priceList': '{currency} 価格表',
  'detail.priceListHint': '同じエンドポイントの公式価格表 · 換算値ではありません',
  'detail.otherEndpoints': '他のエンドポイント',
  'detail.otherEndpointsHint':
    '他のネイティブエンドポイント（地域別）における同じモデル ID の価格を、各請求通貨で表示します。',
  'detail.otherEndpointsError': '他のエンドポイントの読み込みに失敗しました。',
  'copy.copy': 'コピー',
  'copy.copied': 'コピーしました',
  'expr.unit': 'クォータ USD / 1M トークン · 1 クォータ USD = {display}',
  'expr.sheet': '{currency} 価格表を使用',
  'newapi.title': 'new-api 課金設定',
  'newapi.close': '閉じる',
  'newapi.customized': 'カスタム new-api デプロイ設定が有効',
  'newapi.description':
    '式の係数はデプロイ先 new-api の「クォータ USD」建てです。new-api → 設定 → 価格と表示 の値を入力するか、公開されている /api/status のレスポンスを貼り付けて取り込んでください。このサイトの式は即時にその設定で生成されます。',
  'newapi.importTitle': 'new-api サイトから取り込む',
  'newapi.importPlaceholder': 'https://your-new-api.example.com/api/status が返す JSON を貼り付け',
  'newapi.importHint':
    'new-api は /api/status をクロスオリジンで公開していないため、このページから直接取得できません。新しいタブでその URL を開き、レスポンス全体をコピーしてここに貼り付けると、quota_display_type・為替レート・通貨設定が自動入力されます。',
  'newapi.imported': '{source} の設定を取り込みました',
  'newapi.importInvalid':
    '/api/status のレスポンスではありません。ブラウザに表示された JSON 全体を貼り付けてください。',
  'newapi.displayType': 'クォータ表示タイプ',
  'newapi.displayTypeHint':
    'new-api の quota_display_type。「トークンのみ」は課金上 USD と同じ扱いです。',
  'newapi.type.USD': 'USD ($)',
  'newapi.type.CNY': 'CNY (¥)',
  'newapi.type.CUSTOM': 'カスタム通貨',
  'newapi.usdExchangeRate': '1 クォータ USD = ? CNY',
  'newapi.usdExchangeRateHint':
    'new-api の USDExchangeRate：1 クォータ USD を CNY でいくらと表示するか（既定 7.3。クォータを 1:1 で CNY 販売するサイトでは 1）。',
  'newapi.usdExchangeRateReal': '1 USD = ? CNY',
  'newapi.usdExchangeRateRealHint':
    'new-api の USDExchangeRate：実際の USD/CNY レート。公式 CNY 価格表をクォータ USD に換算する際に使用します。',
  'newapi.customSymbol': '通貨記号',
  'newapi.customRate': '1 クォータ USD = ? カスタム通貨',
  'newapi.customRateHint': 'new-api の custom_currency_exchange_rate。',
  'newapi.settlementRate': 'USD 決済レート',
  'newapi.settlementRateHint':
    'new-api の USDSettlementRate：実際の 1 米ドルが表示通貨でいくらか。クォータ USD が実際のドルと同じ場合は空欄にします。',
  'newapi.settlementUnset': '未設定',
  'newapi.preferredList': '優先する価格表の通貨',
  'newapi.preferredListHint':
    'モデルが複数の公式価格表（例: DeepSeek の USD と CNY）を公開している場合、この通貨の価格表があれば優先します。',
  'newapi.summary': '係数の単位：クォータ USD / 1M トークン · 1 クォータ USD = {display}',
  'newapi.summaryInvalid': '係数の単位を確認するには、強調表示された項目を修正してください。',
  'newapi.unaffected':
    'QuotaPerUnit とグループ倍率は new-api が式の後に適用するため、ここでの設定は不要です。',
  'newapi.exportAll': '全プロバイダーの ratio_config をダウンロード',
  'newapi.exporting': '生成中…',
  'newapi.exportFailed': 'エクスポートに失敗しました。再試行してください',
  'newapi.reset': '既定に戻す',
  'newapi.save': '保存',
  'newapi.copyProvider': 'ratio_config をコピー',
  'newapi.mustBePositive': '0 より大きい値が必要です',
  'newapi.mustBeNonNegative': '0 以上の値が必要です',
  'newapi.symbolRequired': '通貨記号は必須です',
  'pricing.estimatedNote':
    '表示価格は上流の USD 値です。このエンドポイントは {currency} で請求されます。',
  'pricing.timeBased': '時間帯別価格',
  'pricing.otherTimes': 'その他の時間帯',
  'pricing.now': '現在',
  'pricing.contextPricing': 'コンテキスト別価格',
  'pricing.thinkingMode': '思考モード',
  'pricing.modalityRates': 'モダリティ別料金',
  'pricing.unitPricing': '従量課金',
  'pricing.base': '基本',
  'pricing.text': 'テキスト',
  'pricing.vision': '画像',
  'pricing.audio': '音声',
  'pricing.textOutputMultimodal': 'テキスト出力 · マルチモーダル入力',
  'pricing.textOutputTextOnly': 'テキスト出力 · テキストのみ入力',
  'pricing.multimodalOutput': 'マルチモーダル出力',
  'pricing.embeddingText': '埋め込み · テキスト',
  'pricing.embeddingImage': '埋め込み · 画像',
  'pricing.reasoningMode': '推論モード',
  'pricing.per10kChars': '1 万文字あたり',
  'pricing.perImage': '画像 1 枚あたり',
  'pricing.perSecond': '1 秒あたり',
  'pricing.perSecondVariant': '1 秒あたり · {variant}',
  'pricing.suffixPerSecond': '/秒',
  'pricing.suffixPer10kChars': '/1万字',
  'pricing.suffixPerImage': '/枚',
};

const MESSAGES: Record<Locale, Messages> = { en, zh, ja };

/** html[lang] 属性值 */
const HTML_LANG: Record<Locale, string> = { en: 'en', zh: 'zh-CN', ja: 'ja' };

const STORAGE_KEY = 'llm-metadata.locale';

function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'zh' || value === 'ja';
}

/** 显式选择优先，其次浏览器语言，兜底英文 */
function detectLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // 忽略存储不可用
  }
  for (const lang of navigator.languages ?? [navigator.language]) {
    const lower = lang.toLowerCase();
    if (lower.startsWith('zh')) return 'zh';
    if (lower.startsWith('ja')) return 'ja';
    if (lower.startsWith('en')) return 'en';
  }
  return 'en';
}

export type Translator = (key: MessageKey, params?: Record<string, string | number>) => string;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translator;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // 存储不可用时仅在当前会话生效
    }
  }, []);

  const t = useCallback<Translator>(
    (key, params) => {
      let text: string = MESSAGES[locale][key];
      if (params) {
        for (const [name, value] of Object.entries(params)) {
          text = text.replaceAll(`{${name}}`, String(value));
        }
      }
      return text;
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
