import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type Locale = 'en' | 'zh' | 'ja';

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
  'app.footerSource': 'Data from {link} and community overrides · Native providers only',
  'app.updated': 'Updated {date}',
  'app.apiDocs': 'API documentation',
  'theme.toggle': 'Toggle theme',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'theme.system': 'System',
  'locale.change': 'Change language',
  'sidebar.filter': 'Filter providers…',
  'sidebar.title': 'Providers',
  'sidebar.empty': 'No providers.',
  'table.model': 'Model',
  'table.context': 'Context',
  'table.input': 'Input',
  'table.cacheRead': 'Cache read',
  'table.cacheWrite': 'Cache write',
  'table.output': 'Output',
  'table.tiered': 'Tiered',
  'table.thinking': 'Thinking',
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
  'copy.copy': 'Copy to clipboard',
  'copy.copied': 'Copied',
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
  'app.footerSource': '数据来自 {link} 与社区覆写 · 仅收录原生供应商',
  'app.updated': '更新于 {date}',
  'app.apiDocs': 'API 文档',
  'theme.toggle': '切换主题',
  'theme.light': '浅色',
  'theme.dark': '深色',
  'theme.system': '跟随系统',
  'locale.change': '切换语言',
  'sidebar.filter': '筛选供应商…',
  'sidebar.title': '供应商',
  'sidebar.empty': '没有匹配的供应商。',
  'table.model': '模型',
  'table.context': '上下文',
  'table.input': '输入',
  'table.cacheRead': '缓存读',
  'table.cacheWrite': '缓存写',
  'table.output': '输出',
  'table.tiered': '阶梯',
  'table.thinking': '思考',
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
  'copy.copy': '复制',
  'copy.copied': '已复制',
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
  'app.footerSource':
    'データは {link} とコミュニティの上書きに基づく · ネイティブプロバイダーのみ',
  'app.updated': '更新日 {date}',
  'app.apiDocs': 'API ドキュメント',
  'theme.toggle': 'テーマを切り替え',
  'theme.light': 'ライト',
  'theme.dark': 'ダーク',
  'theme.system': 'システム',
  'locale.change': '言語を変更',
  'sidebar.filter': 'プロバイダーを絞り込む…',
  'sidebar.title': 'プロバイダー',
  'sidebar.empty': '該当するプロバイダーがありません。',
  'table.model': 'モデル',
  'table.context': 'コンテキスト',
  'table.input': '入力',
  'table.cacheRead': 'キャッシュ読取',
  'table.cacheWrite': 'キャッシュ書込',
  'table.output': '出力',
  'table.tiered': '段階',
  'table.thinking': '思考',
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
  'copy.copy': 'コピー',
  'copy.copied': 'コピーしました',
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
