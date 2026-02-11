---
hide:
  - navigation
---

# LLM 元數據

一個用於發現與整合大語言模型（LLM）元數據的輕量級靜態 API。

## 🌐 基礎位址

| 站點             | Base URL                                  |
| ---------------- | ----------------------------------------- |
| GitHub Pages     | `https://basellm.github.io/llm-metadata/` |
| Cloudflare Pages | `https://llm-metadata.pages.dev/`         |

## 📡 API 接口

!!! info "說明"
    預設提供的語言有 `en`、`zh`、`ja`。

| 接口                                                    | 說明                 | 示例                                            |
| ------------------------------------------------------- | -------------------- | ----------------------------------------------- |
| `/api/index.json`                                       | 提供商與模型總覽     | 獲取所有提供商與模型的基礎資訊                  |
| `/api/providers.json`                                   | 提供商列表與統計     | 獲取提供商列表以及模型數量統計                  |
| `/api/all.json`                                         | 完整模型數據集       | 獲取所有模型的詳細資訊                          |
| `/api/newapi/ratio_config-v1-base.json`                 | New API 價格比率     | New API 系統用於價格計算的比率設定              |
| `/api/newapi/providers/{providerId}/ratio_config-v1-base.json` | 單一提供商的 New API 價格比率 | 示例：`/api/newapi/providers/anthropic/ratio_config-v1-base.json` |
| `/api/newapi/vendors.json`                              | New API 供應商數據   | 相容 New API 系統的供應商數據行                 |
| `/api/newapi/models.json`                               | New API 模型數據     | 相容 New API 系統的模型數據行                   |
| `/api/voapi/firms.json`                                 | VoAPI 供應商數據     | 相容 VoAPI 系統的供應商數據行                   |
| `/api/voapi/models.json`                                | VoAPI 模型數據       | 相容 VoAPI 系統的模型數據行                     |
| `/api/manifest.json`                                    | 構建清單與統計       | 構建資訊與數據統計                              |
| `/api/providers/{providerId}.json`                      | 單個提供商詳情       | 示例：`/api/providers/openai.json`              |
| `/api/models/{providerId}/{modelId}.json`               | 單個模型元數據       | 示例：`/api/models/openai/gpt-4.json`           |
| `/api/i18n/{locale}/index.json`                         | 本地化索引           | 示例：`../api/i18n/zh/index.json`               |
| `/api/i18n/{locale}/providers.json`                     | 本地化提供商列表     | 示例：`../api/i18n/ja/providers.json`           |
| `/api/i18n/{locale}/all.json`                           | 本地化完整數據集     | 示例：`../api/i18n/zh/all.json`                 |
| `/api/i18n/{locale}/providers/{providerId}.json`        | 本地化提供商詳情     | 示例：`../api/i18n/zh/providers/openai.json`    |
| `/api/i18n/{locale}/models/{providerId}/{modelId}.json` | 本地化模型元數據     | 示例：`../api/i18n/ja/models/openai/gpt-4.json` |
| `/api/i18n/{locale}/newapi/vendors.json`                | 本地化 NewAPI 供應商 | 示例：`../api/i18n/zh/newapi/vendors.json`      |
| `/api/i18n/{locale}/newapi/models.json`                 | 本地化 NewAPI 模型   | 示例：`../api/i18n/ja/newapi/models.json`       |

## 📊 數據來源

- [models.dev/api.json](https://models.dev/api.json) - 主數據源
- BaseLLM 社群貢獻 - 補充與修正

## 📄 許可證

AGPL-3.0 license - 參見 [LICENSE](https://github.com/basellm/llm-metadata/blob/main/LICENSE)
