---
hide:
  - navigation
---

# LLM メタデータ

大規模言語モデル（LLM）のメタデータを発見・統合するための軽量な静的 API。

## 🌐 ベース URL

| サイト           | ベース URL                                |
| ---------------- | ----------------------------------------- |
| GitHub Pages     | `https://basellm.github.io/llm-metadata/` |
| Cloudflare Pages | `https://llm-metadata.pages.dev/`         |

## 📡 API エンドポイント

!!! info "注記"
    デフォルトの言語は `en`、`zh`、`ja` です。

| エンドポイント                                                                     | 説明                         | 例                                            |
| ---------------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------- |
| [`/api/index.json`](../api/index.json)                                             | プロバイダーとモデル概要     | すべてのプロバイダーとモデルの基本情報        |
| [`/api/providers.json`](../api/providers.json)                                     | プロバイダー一覧と統計       | プロバイダー一覧とモデル数統計                |
| [`/api/all.json`](../api/all.json)                                                 | 完全なモデルデータセット     | すべてのモデルの詳細情報                      |
| [`/api/newapi/ratio_config-v1-base.json`](../api/newapi/ratio_config-v1-base.json) | New API 価格比率             | New API システムにおける価格計算の比率        |
| [`/api/newapi/vendors.json`](../api/newapi/vendors.json)                           | New API ベンダーデータ       | New API システム向けのベンダーデータ          |
| [`/api/newapi/models.json`](../api/newapi/models.json)                             | New API モデルデータ         | New API システム向けのモデルデータ            |
| [`/api/voapi/firms.json`](../api/voapi/firms.json)                                 | VoAPI 企業データ             | VoAPI システム向けの企業データ                |
| [`/api/voapi/models.json`](../api/voapi/models.json)                               | VoAPI モデルデータ           | VoAPI システム向けのモデルデータ              |
| [`/api/manifest.json`](../api/manifest.json)                                       | ビルド情報と統計             | ビルド情報およびデータ統計                    |
| `/api/providers/{providerId}.json`                                                 | 個別プロバイダー詳細         | 例：`/api/providers/openai.json`              |
| `/api/models/{providerId}/{modelId}.json`                                          | 個別モデルメタデータ         | 例：`/api/models/openai/gpt-4.json`           |
| `/api/i18n/{locale}/index.json`                                                    | ローカライズ索引             | 例：`../api/i18n/zh/index.json`               |
| `/api/i18n/{locale}/providers.json`                                                | ローカライズ提供者           | 例：`../api/i18n/ja/providers.json`           |
| `/api/i18n/{locale}/all.json`                                                      | ローカライズ全データ         | 例：`../api/i18n/zh/all.json`                 |
| `/api/i18n/{locale}/providers/{providerId}.json`                                   | ローカライズ提供者詳細       | 例：`../api/i18n/zh/providers/openai.json`    |
| `/api/i18n/{locale}/models/{providerId}/{modelId}.json`                            | ローカライズモデル情報       | 例：`../api/i18n/ja/models/openai/gpt-4.json` |
| `/api/i18n/{locale}/newapi/vendors.json`                                           | ローカライズ NewAPI ベンダー | 例：`../api/i18n/zh/newapi/vendors.json`      |
| `/api/i18n/{locale}/newapi/models.json`                                            | ローカライズ NewAPI モデル   | 例：`../api/i18n/ja/newapi/models.json`       |

## 📊 データソース

- [models.dev/api.json](https://models.dev/api.json) - 主要データソース
- BaseLLM コミュニティの貢献 - 補足と修正

## 📄 ライセンス

AGPL-3.0 license - 参照 [LICENSE](https://github.com/basellm/llm-metadata/blob/main/LICENSE)
