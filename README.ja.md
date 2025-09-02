# LLM Metadata

> LLM メタデータを発見・統合するための軽量な「静的 API」。ライブ: [basellm.github.io/llm-metadata](https://basellm.github.io/llm-metadata/)

[English](README.md) | [简体中文](README.zh-CN.md) | 日本語

高スループットに親和的な静的インターフェース: 変更時のみ再ビルドし、GitHub Pages から静的 JSON を配信します。

データソース: [models.dev/api.json](https://models.dev/api.json) + BaseLLM コミュニティの貢献

## クイックスタート

要件: Node.js 18+（ネイティブ `fetch` を使用）

```bash
npm install
npm run build
```

出力: `dist/api/`

スクリプト:

- `npm run build` — TypeScript をコンパイルし、API を構築（変更がなければ無変更）
- `npm run build:force` — すべてのファイルを強制再生成
- `npm run check` — 変更検出のみ（CI 用）
- `npm run clean` — `.cache` と `dist` を削除
- `npm run compile` — TypeScript のみコンパイル
- `npm run dev` — ウォッチモードでコンパイル

## 国際化（ドキュメントと API）

ドキュメント i18n は `i18n/docs/*.json` と `i18n/locales.json`（mkdocs-static-i18n）で管理し、API i18n は `i18n/api/*.json` と `data/overrides.json` で管理します。

### ディレクトリ構成

```
i18n/
  locales.json          # 言語一覧（唯一の信頼できるソース）
  docs/
    en.json             # ドキュメント UI 文字列（英語がフォールバック）
    zh.json
    ja.json
  api/
    en.json             # 機能ラベル + 既定の説明テンプレート
    zh.json
    ja.json
docs/
  en/ index.md data.md
  zh/ index.md data.md
  ja/ index.md data.md
```

### 言語を追加する（例: `fr`）

1. `i18n/locales.json` に追加:

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

2. `i18n/docs/en.json` をコピーして `i18n/docs/fr.json` を作成し翻訳
3. `i18n/api/en.json` をコピーして `i18n/api/fr.json` を作成し翻訳（機能ラベル + 既定説明テンプレート）
4. `docs/fr/index.md` を作成し、空の `docs/fr/data.md` を用意（ビルドで自動生成）
5. 任意: `mkdocs.yml` に `fr` の `nav_translations` を追加
6. ビルド: `npm run build`

### API i18n の詳細

- 機能ラベル（capability labels）は `i18n/api/<locale>.json` から取得し、以下に適用されます:
  - 明示的な `model.tags`
  - ブール能力: tools / files / reasoning / temperature / open_weights
  - モダリティ由来タグ: vision / audio
- ローカライズ済み API 出力:
  - `dist/api/i18n/<locale>/all.json`
  - `dist/api/i18n/<locale>/providers.json`, `index.json`
  - 分割ファイル: `dist/api/i18n/<locale>/{providers,models}/...`
- NewAPI ペイロード:
  - 英語（安定版）: `dist/api/newapi/{vendors.json,models.json}`
  - ローカライズ版: `dist/api/i18n/<locale>/newapi/{vendors.json,models.json}`
- 既定の説明テンプレート（ロケールごと）:
  - `i18n/api/<locale>.json` → `defaults.model_description`
  - プレースホルダ: `${modelName}`, `${providerId}`
  - あるモデルの説明が英語の既定説明と一致する場合、ローカライズ構築ではロケールのテンプレートに置換

### ドキュメント i18n（MkDocs）

- 文字列は `i18n/docs/<locale>.json` から取得（欠落キーは英語へフォールバック）
- `npm run build` で `docs/<locale>/data.md` を自動生成
- プレビュー: `pip install -r requirements.txt` の後、`mkdocs serve`

## 更新モード

- 手動: `data/**` を編集して main にプッシュ → CI がビルド&公開
- 自動: スケジュール取得で差分検出、ポリシーで許可されたモデルのみ増分更新

GitHub Actions トリガー:

- `push`（`scripts/**`, `data/**` 等）
- `workflow_dispatch`（手動）
- `schedule`（6 時間ごと）

## 自動更新ポリシー

設定ファイル: `data/policy.json`（既定で `auto=true`）。例:

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

モデルが `auto=false` の場合、自動モードは既存の静的ファイルを上書きしません（初回生成は行われます）。

## オーバーライド（Overrides）

設定ファイル: `data/overrides.json`

```json
{
  "providers": {
    "openai": {
      "name": "OpenAI（カスタム）",
      "api": "https://api.openai.com",
      "doc": "https://platform.openai.com/docs",
      "icon": "https://example.com/icons/openai.svg",
      "lobeIcon": "OpenAI.Color"
    }
  },
  "models": {
    "openai/gpt-4o": {
      "description": "強力な推論を備えたマルチモーダル最適化モデル。",
      "tags": ["vision", "tools"],
      "limit": { "context": 131072, "output": 8192 },
      "modalities": { "input": ["text", "image"], "output": ["text"] },
      "reasoning": true,
      "tool_call": true,
      "attachment": false
    }
  }
}
```

オーバーライドは「深いマージ」を行い、元のフィールドを削除せずに上書きまたは追加します。

- プロバイダーの上書き（例: `providers.deepseek.name`, `icon`, `lobeIcon`, `api`, `doc`）
  - 影響範囲:
    - `dist/api/providers.json`
    - `dist/api/providers/<provider>.json`
    - `dist/api/all.json`
    - `dist/api/newapi/vendors.json`

- モデルの上書き（例: `models["deepseek/deepseek-reasoner"].description`, `tags`, `limit`, `modalities`, `cost`, `reasoning`, `tool_call`, `attachment`）
  - 影響範囲:
    - `dist/api/all.json`
    - `dist/api/models/<provider>/<model>.json`
    - `dist/api/newapi/models.json`
