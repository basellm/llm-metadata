# LLM Metadata

> 輕量級的 LLM 元數據「靜態 API」。線上位址：
> [GitHub Pages](https://basellm.github.io/llm-metadata/) · [Cloudflare Pages](https://llm-metadata.pages.dev/)

[中文文件](README.zh-TW.md) | [English](README.md) | [日本語](README.ja.md)

面向高併發的靜態接口：僅在源數據或設定變化時重建，其餘時間通過 GitHub Pages 提供靜態 JSON。

數據來源：[models.dev/api.json](https://models.dev/api.json) + basellm 社群貢獻。

## 快速開始

要求：Node.js 18+（內置 `fetch`）

```bash
npm install
npm run build
```

產物位置：`dist/api/`

常用腳本：

- `npm run build`：編譯 TypeScript 並構建 API（如無變化則不改寫檔案）
- `npm run build:force`：強制重建所有檔案
- `npm run check`：僅檢查是否會產生輸出變更（CI 可用）
- `npm run clean`：清理 `.cache` 與 `dist`
- `npm run compile`：僅編譯 TypeScript
- `npm run dev`：監聽模式編譯

## 國際化（文件與 API）

文件 i18n 由 `i18n/docs/*.json` 與 `i18n/locales.json` 驅動，並通過 mkdocs-static-i18n 發佈；API i18n 由 `i18n/api/*.json` 與 `data/overrides/**` 驅動。

### 目錄與設定

```
i18n/
  locales.json          # 語言清單（唯一真相來源）
  docs/
    en.json             # 文件 UI 詞條（兜底）
    zh.json
    ja.json
  api/
    en.json             # 能力標籤 + 預設描述模板
    zh.json
    ja.json
docs/
  en/ index.md data.md
  zh/ index.md data.md
  ja/ index.md data.md
```

### 新增語言（以 `fr` 為例）

1）在 `i18n/locales.json` 增加：

```json
{
  "locales": [
    { "locale": "en", "default": true },
    { "locale": "zh" },
    { "locale": "ja" },
    { "locale": "fr" }
  ]
}
```

2）複製 `i18n/docs/en.json` 為 `i18n/docs/fr.json` 並翻譯
3）複製 `i18n/api/en.json` 為 `i18n/api/fr.json` 並翻譯（包含 capability labels 與預設描述模板）
4）添加 `docs/fr/index.md` 與空白 `docs/fr/data.md`（構建時自動生成）
5）可選：在 `mkdocs.yml` 為 `fr` 添加 `nav_translations`
6）構建：`npm run build`

### API i18n 細節

- 能力標籤來自 `i18n/api/<locale>.json`，應用於：
  - 顯式 `model.tags`
  - 布爾能力：tools/files/reasoning/temperature/open_weights
  - 模態衍生標籤：vision/audio
- 本地化 API 數據輸出：
  - `dist/api/i18n/<locale>/all.json`
  - `dist/api/i18n/<locale>/providers.json`、`index.json`
  - 拆分檔案：`dist/api/i18n/<locale>/{providers,models}/...`
- NewAPI 載荷：
  - 英文（穩定）：`dist/api/newapi/{vendors.json,models.json}`
  - 本地化：`dist/api/i18n/<locale>/newapi/{vendors.json,models.json}`
- 預設描述模板（支援佔位符）：
  - `i18n/api/<locale>.json` → `defaults.model_description`，佔位 `${modelName}`、`${providerId}`
  - 若某模型描述等於英文預設描述，本地化構建將自動替換為對應語言模板

### 文件 i18n（mkdocs）

- 詞條來自 `i18n/docs/<locale>.json`；缺失鍵自動回退英文
- `npm run build` 自動輸出 `docs/<locale>/data.md`
- 預覽文件：`pip install -r requirements.txt` 後執行 `mkdocs serve`

## 更新模式

- 手動模式：直接編輯 `data/**`，推送到主分支後 CI 自動構建與發佈
- 自動模式：按計劃抓取上游，檢測變化後僅對允許自動更新的模型增量寫入

觸發策略（GitHub Actions 已設定）：

- push 到 `scripts/**`、`data/**` 等路徑
- `workflow_dispatch` 手動觸發
- `schedule` 每 6 小時定時

## 自動更新策略（模型級開關）

組態檔：`data/policy.json`（預設 `auto=true`）。示例：

```json
{
  "providers": {
    "deepseek": { "auto": true },
    "xai": { "auto": true }
  },
  "models": {
    "deepseek/deepseek-reasoner": { "auto": false },
    "xai/grok-4": { "auto": true }
  }
}
```

當某模型 `auto=false` 時，自動模式不會覆蓋其現有靜態檔案（首次構建仍會生成）。

## 覆寫（Overrides，目錄化）

已從單一 `data/overrides.json` 遷移為目錄化結構，避免多人同時修改時的衝突。將小型 JSON 片段放入如下目錄，構建時會深度合併：

```
data/
  overrides/
    providers/
      <providerId>.json            # 提供商級覆寫（如 lobeIcon、iconURL、name、api、doc）
    models/
      <providerId>/<modelId>.json  # 模型級覆寫（description、limit、modalities、cost、能力標記等）
    i18n/
      providers/<providerId>.json  # 可選：提供商名稱/描述本地化
      models/<providerId>/<modelId>.json  # 可選：模型名稱/描述本地化
```

示例：

提供商圖示（`data/overrides/providers/openai.json`）：

```json
{ "lobeIcon": "OpenAI.Color" }
```

模型覆寫（`data/overrides/models/openai/gpt-4o.json`）：

```json
{
  "description": "面向多模態、具備較強推理能力的優化模型。",
  "limit": { "context": 131072, "output": 8192 },
  "modalities": { "input": ["text", "image"], "output": ["text"] },
  "reasoning": true,
  "tool_call": true,
  "attachment": false
}
```

說明：

- 使用深度合併；未聲明字段會保持原值。
- 模型覆寫字段白名單（會進行清洗）：`id`、`name`、`description`、`reasoning`、`tool_call`、`attachment`、`temperature`、`knowledge`、`release_date`、`last_updated`、`open_weights`、`modalities`、`limit`、`cost`。
- 僅從 `data/overrides/**` 讀取。
