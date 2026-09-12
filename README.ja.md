# LLM Metadata

> LLM メタデータを発見・統合するための軽量な「静的 API」。ライブ:
> [GitHub Pages](https://basellm.github.io/llm-metadata/) · [Cloudflare Pages](https://llm-metadata.pages.dev/)

[English](README.md) | [简体中文](README.zh-CN.md) | 日本語

高スループットに親和的な静的インターフェース: 変更時のみ再ビルドし、GitHub Pages から静的 JSON を配信します。ライブサイトにはミニマルな価格ブラウザ（`web/`、Vite + React + Tailwind + shadcn/ui）が含まれ、静的 API から直接プロバイダーごとのモデル価格テーブルを表示します。ライト/ダークテーマ（既定でシステムに追従）と英語/中国語/日本語の UI に対応しています。

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
    "anthropic": { "lobeIcon": "Claude.Color", "cacheWrite1h": 2 },
    "zai": { "priority": 20, "lobeIcon": "ZAI" },
    "alibaba": {
      "priority": 30,
      "excludeModels": ["^deepseek", "^kimi"],
      "thinkingToggle": { "param": "enable_thinking", "value": true }
    }
  }
}
```

- `providers` — 許可リスト。未記載のプロバイダーはすべての出力（JSON API、NewAPI、VoAPI、Web UI）から除外され、過去の生成物もビルド時に `dist/api/` から削除されます。
- `excludeModels` — 大文字小文字を区別しない正規表現。ネイティブプロバイダーのプラットフォームでホストされるサードパーティモデル（例: Alibaba 上で再販される DeepSeek モデル）を除外し、自社モデルのみを保持します。
- `priority` — 同一ベンダーの複数エンドポイント（例: `zai` と `zhipuai`）間で同名モデルが競合した場合の解決に使用。集約 NewAPI 出力では値が大きい方が優先され、同値の場合はプロバイダー ID 順になります。`/api/newapi/providers/<id>/` 配下のプロバイダー別ファイルには常にそのプロバイダー自身の価格が保持されます。
- `exchangeRates` — 1 USD あたりの通貨単位。非 USD 価格（例: 人民元）を NewAPI 課金式の USD 係数へ正規化するために使用します。レート未設定の通貨は価格出力からスキップされ、ビルド警告が出ます。
- `thinkingToggle` — そのプロバイダーのハイブリッド推論モデルを思考モードに切り替えるリクエストボディのフィールド（gjson パス）と値。モデルの `cost.reasoning` が `cost.output` と異なる場合、式は `param("<param>") == <value>` を条件に出力トークンを reasoning 価格で課金します。未設定なら output 価格が適用され、ビルド警告が出ます。
- `cacheWrite1h` — 1 時間 TTL のプロンプトキャッシュ書き込み価格を入力価格の倍率で指定（Anthropic は 2）。`cc`（models.dev の `cache_write` 価格）の隣に `cc1h` 項を出力します。未設定の場合、new-api は Claude 形式の 1h キャッシュ書き込みを課金しません。
- `lobeIcon` — [@lobehub/icons](https://github.com/lobehub/lobe-icons) のエクスポート名（例: `Claude.Color`）。NewAPI `vendors.json` のベンダーアイコンとして使用されます。
- このファイルが存在しない場合、フィルタリングは無効になり、ビルド警告が出力されます。

プロバイダーのロゴはビルド時に `dist/api/logos/<id>.svg` へミラーリングされ、Web UI は同一オリジンからアイコンを読み込みます（リモート `iconURL` とイニシャルバッジがフォールバック）。models.dev へのホットリンクは行いません。

## NewAPI 課金式

`dist/api/newapi/ratio_config-v1-base.json` は new-api の `/api/ratio_config` ペイロード形式に準拠しており、new-api の倍率同期 UI に組み込まれた「公式倍率プリセット」のデータソースです。プロバイダー別のファイルは `/api/newapi/providers/<id>/` にあります。`vendors.json` / `models.json` はメタデータ（説明、タグ、ベンダー、アイコン）のみを含み、new-api のモデルメタデータ同期に使用されます。

価格を持つすべてのモデルは new-api 課金式（`billing_mode: "tiered_expr"` + `billing_expr`）として公開されます。倍率設定に `model_ratio` / `completion_ratio` / `cache_ratio` / `model_price` は含まれません。式は expr-lang 構文で、係数は USD/100 万トークンの実価格、各価格リーフは `tier("<name>", …)` でラップされます:

| 価格形態                                    | 元フィールド                                                | 式                                                                                                                     |
| ------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 単一価格                                    | `input`, `output`, `cache_read`, `cache_write`, `*_audio`   | `tier("standard", p * 3 + cr * 0.3 + cc * 3.75 + cc1h * 6 + c * 15)`                                                   |
| コンテキスト段階                            | `tiers[]`（`context_over_200k` はレガシーのフォールバック） | `len <= 200000 ? tier("0_200k", …) : tier("200k_plus", …)`                                                             |
| 思考モード（プロバイダーの `thinkingToggle`）| `reasoning` ≠ `output`                                      | `param("enable_thinking") == true ? tier("thinking", p * 0.4 + c * 4) : tier("standard", p * 0.4 + c * 1.2)`            |
| 時間帯別（ピーク/オフピーク）               | `schedule`（上書き拡張、下記参照）                          | `weekday("UTC") >= 1 && weekday("UTC") <= 5 && ((hour("UTC") >= 1 && hour("UTC") < 4) \|\| …) ? tier("peak", …) : tier("off_peak", …)` |
| 画像 1 枚あたり                             | `per_image`（トークン価格なし）                             | `tier("image", fixed(0.04)) * image_count`                                                                             |

分岐は外側から 時間帯 → 思考モード → コンテキスト段階 の順にネストし、new-api の価格 UI が構造的に表示できる形状に一致します（時間帯条件は "Mon–Fri 01:00–04:00 or 06:00–10:00 (UTC)" のように表示）。明示的なゼロ価格は `cr * 0` などとして保持されます。new-api は式が変数を参照する場合にのみキャッシュ/音声トークンを `p`/`c` から除外するためです。表現できない価格（トグルのない独立した推論トークン価格など）は文書上の出力価格で式を生成し、`manifest.json` の warnings に記録されます。

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

時間帯別価格（`data/overrides/models/deepseek/deepseek-flash.json`）— `cost.schedule` は、ピーク/オフピーク料金を持つプロバイダー向けの、models.dev コストスキーマに対する本リポジトリの拡張です:

```json
{
  "cost": {
    "input": 0.15,
    "output": 0.6,
    "reasoning": 0.6,
    "cache_read": 0.003,
    "schedule": {
      "timezone": "UTC",
      "fallback": "off_peak",
      "windows": [
        {
          "name": "peak",
          "weekdays": [1, 2, 3, 4, 5],
          "hours": ["01:00-04:00", "06:00-10:00"],
          "input": 0.3,
          "output": 1.2,
          "reasoning": 1.2,
          "cache_read": 0.006
        }
      ]
    }
  }
}
```

- 基本の `cost` 価格はすべてのウィンドウ外で適用され、段階名は `fallback` になります。ウィンドウは順に照合され、任意の価格ファミリーを上書きできます（未指定のファミリーは基本価格を継承）。コンテキスト `tiers` を持つモデルのウィンドウは独自の `tiers` を定義する必要があります。
- `timezone` は IANA タイムゾーン、`weekdays` は 0 = 日曜 … 6 = 土曜、`hours` は `HH:MM-HH:MM`（終了は含まない、`24:00` 可）で、終了が開始より前なら日付をまたぎます。正時のウィンドウは new-api が構造的に表示できる `hour(tz)` 比較に、分単位のウィンドウは分数の算術式にコンパイルされます。
- 不正なスケジュールは明示的に失敗します。そのモデルは式を出力せず、理由が `manifest.json` の warnings に記録されます。

注意:

- 深いマージを適用。未指定のフィールドは保持されます。上書きでは依存するすべての価格（`reasoning` を含む）を固定し、上流の変更でウィンドウ価格と基本価格が食い違わないようにしてください。
- モデル上書きの許可キー（サニタイズ対象）: `id`, `name`, `description`, `reasoning`, `tool_call`, `attachment`, `temperature`, `knowledge`, `release_date`, `last_updated`, `open_weights`, `modalities`, `limit`, `cost`。`$comment` などのキーは破棄されるため、メンテナー用メモとして安全に使えます。
- 参照元は `data/overrides/**` のみ。
