# LLM Metadata

> LLM メタデータを発見・統合するための軽量な「静的 API」。ライブ:
> [GitHub Pages](https://basellm.github.io/llm-metadata/) · [Cloudflare Pages](https://llm-metadata.pages.dev/)

[English](README.md) | [简体中文](README.zh-CN.md) | 日本語

高スループットに親和的な静的インターフェース: 変更時のみ再ビルドし、GitHub Pages から静的 JSON を配信します。ライブサイトにはミニマルな価格ブラウザ（`web/`、Vite + React + Tailwind + shadcn/ui）が含まれ、静的 API から直接プロバイダーごとのモデル価格テーブルを表示します。

データソース: [models.dev/api.json](https://models.dev/api.json) + BaseLLM コミュニティの貢献。`data/native-providers.json` によりネイティブ（ファーストパーティ）プロバイダーのみを保持します。

## クイックスタート

要件: Node.js 20.19+（API ビルドは 18+ で動作、web UI ツールチェーンは 20.19+ が必要）

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
- `npm run web:dev` — 価格 UI の開発サーバー（事前に一度 `npm run build` を実行し `dist/api` を生成）
- `npm run web:build` — 価格 UI を `dist/` にビルド（事前に `web/` で `npm install` を実行）

## ネイティブプロバイダー

上流の models.dev データには、ファーストパーティのプロバイダーに加えてアグリゲーター、リセラー、クラウドホスティングが混在しています。ビルド時にネイティブ（ファーストパーティ）プロバイダー——実際にモデルを開発している企業——のみを保持し、公開されるすべての価格が公式価格であることを保証します。

カタログ設定: `data/native-providers.json`

```json
{
  "version": 1,
  "exchangeRates": { "CNY": 7.3, "EUR": 0.92 },
  "providers": {
    "openai": { "lobeIcon": "OpenAI" },
    "zai": { "priority": 20, "lobeIcon": "ZAI" },
    "alibaba": { "priority": 30, "excludeModels": ["^deepseek", "^kimi"] }
  }
}
```

- `providers` — 許可リスト。未記載のプロバイダーはすべての出力（JSON API、NewAPI、VoAPI、Web UI）から除外され、過去の生成物もビルド時に `dist/api/` から削除されます。
- `excludeModels` — 大文字小文字を区別しない正規表現。ネイティブプロバイダーのプラットフォームでホストされるサードパーティモデル（例: Alibaba 上で再販される DeepSeek モデル）を除外し、自社モデルのみを保持します。
- `priority` — 同一ベンダーの複数エンドポイント（例: `zai` と `zhipuai`）間で同名モデルが競合した場合の解決に使用。集約 NewAPI 出力では値が大きい方が優先され、同値の場合はプロバイダー ID 順になります。`/api/newapi/providers/<id>/` 配下のプロバイダー別ファイルには常にそのプロバイダー自身の価格が保持されます。
- `exchangeRates` — 1 USD あたりの通貨単位。非 USD 価格（例: 人民元）を NewAPI の USD ベース倍率体系（1 倍率 = $2 / 100 万入力トークン）に正規化するために使用します。レート未設定の通貨は価格出力からスキップされ、ビルド警告が出ます。
- `lobeIcon` — [@lobehub/icons](https://github.com/lobehub/lobe-icons) のエクスポート名（例: `Claude.Color`）。NewAPI `vendors.json` のベンダーアイコンとして使用されます。
- このファイルが存在しない場合、フィルタリングは無効になり、ビルド警告が出力されます。

プロバイダーのロゴはビルド時に `dist/api/logos/<id>.svg` へミラーリングされ、Web UI は同一オリジンからアイコンを読み込みます（リモート `iconURL` とイニシャルバッジがフォールバック）。models.dev へのホットリンクは行いません。

NewAPI 互換性: `dist/api/newapi/ratio_config-v1-base.json` は new-api の `/api/ratio_config` ペイロード形式に準拠しており、new-api の倍率同期 UI に組み込まれた「公式倍率プリセット」のデータソースです。`vendors.json` / `models.json` はモデルメタデータ同期に使用されます。

式ベース課金（`tiered_expr`）: 長さ階層別価格（例: `input_32k_128k`）や思考モード差額価格（`thinking_input` / `thinking_output`）を持つモデルは、倍率設定に `billing_mode` / `billing_expr` マップを追加出力します。式は expr-lang 構文で、係数は USD/100 万トークン単位（`len` による三項演算子チェーン + `tier()` ラップ、思考モードは `param("enable_thinking")` で判定）です。new-api 適用後は式が倍率より優先されます。通常の倍率もフォールバックとして併せて出力されます。

## 国際化（API）

API i18n は `i18n/locales.json`（言語一覧）、`i18n/api/*.json`（機能ラベルと既定説明テンプレート）、および `data/overrides/**` で管理します。

### ディレクトリ構成

```
i18n/
  locales.json          # 言語一覧（唯一の信頼できるソース）
  api/
    en.json             # 機能ラベル + 既定の説明テンプレート
    zh.json
    ja.json
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

2. `i18n/api/en.json` をコピーして `i18n/api/fr.json` を作成し翻訳（機能ラベル + 既定説明テンプレート）
3. ビルド: `npm run build`

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

## 更新モード

- 手動: `data/**` を編集して main にプッシュ → CI がビルド&公開
- 自動: スケジュール取得で差分検出、ポリシーで許可されたモデルのみ増分更新

GitHub Actions トリガー:

- `push`（`src/**`, `data/**`, `web/**` 等）
- `workflow_dispatch`（手動）
- `schedule`（毎日）

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

## オーバーライド（Overrides、ディレクトリ構成）

単一の `data/overrides.json` から、競合に強いディレクトリ構成へ移行しました。以下の場所に小さな JSON を置くと、ビルド時に深いマージで統合されます:

```
data/
  overrides/
    providers/
      <providerId>.json            # プロバイダーの上書き（lobeIcon、iconURL、name、api、doc など）
    models/
      <providerId>/<modelId>.json  # モデルの上書き（description、limit、modalities、cost、各種フラグ）
    i18n/
      providers/<providerId>.json  # 任意: プロバイダーの名前/説明のローカライズ
      models/<providerId>/<modelId>.json  # 任意: モデルの名前/説明のローカライズ
```

例:

プロバイダーアイコン（`data/overrides/providers/openai.json`）:

```json
{ "lobeIcon": "OpenAI.Color" }
```

モデル上書き（`data/overrides/models/openai/gpt-4o.json`）:

```json
{
  "description": "強力な推論を備えたマルチモーダル最適化モデル。",
  "limit": { "context": 131072, "output": 8192 },
  "modalities": { "input": ["text", "image"], "output": ["text"] },
  "reasoning": true,
  "tool_call": true,
  "attachment": false
}
```

注意:

- 深いマージを適用。未指定のフィールドは保持されます。
- モデル上書きの許可キー（サニタイズ対象）: `id`, `name`, `description`, `reasoning`, `tool_call`, `attachment`, `temperature`, `knowledge`, `release_date`, `last_updated`, `open_weights`, `modalities`, `limit`, `cost`。
- 参照元は `data/overrides/**` のみ。
