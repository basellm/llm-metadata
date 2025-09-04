---
hide:
  - navigation
---

# LLM Metadata

A lightweight static API for discovering and integrating large language model (LLM) metadata.

## 📡 API Endpoints

!!! info "Note"
    Available locales include `en`, `zh`, `ja` by default.

| Endpoint                                                                                                               | Description                   | Example                                                                                |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| [`/api/index.json`](https://basellm.github.io/llm-metadata/api/index.json)                                             | Provider and model overview   | Get basic information about all providers and models                                   |
| [`/api/providers.json`](https://basellm.github.io/llm-metadata/api/providers.json)                                     | Provider list and statistics  | Get provider list and model count statistics                                           |
| [`/api/all.json`](https://basellm.github.io/llm-metadata/api/all.json)                                                 | Complete model dataset        | Get detailed information for all models                                                |
| [`/api/newapi/ratio_config-v1-base.json`](https://basellm.github.io/llm-metadata/api/newapi/ratio_config-v1-base.json) | New API price ratios          | Price calculation ratios for New API system                                            |
| [`/api/newapi/vendors.json`](https://basellm.github.io/llm-metadata/api/newapi/vendors.json)                           | New API vendors payload       | Vendor rows adapted for New API system                                                 |
| [`/api/newapi/models.json`](https://basellm.github.io/llm-metadata/api/newapi/models.json)                             | New API models payload        | Model rows adapted for New API system                                                  |
| [`/api/voapi/firms.json`](https://basellm.github.io/llm-metadata/api/voapi/firms.json)                             | VoAPI firms payload           | Firm rows adapted for VoAPI system                                                    |
| [`/api/voapi/models.json`](https://basellm.github.io/llm-metadata/api/voapi/models.json)                             | VoAPI models payload          | Model rows adapted for VoAPI system                                                  |
| [`/api/manifest.json`](https://basellm.github.io/llm-metadata/api/manifest.json)                                       | Build manifest and statistics | Build information and data statistics                                                  |
| `/api/providers/{providerId}.json`                                                                                     | Individual provider details   | Example: `/api/providers/openai.json`                                                  |
| `/api/models/{providerId}/{modelId}.json`                                                                              | Individual model metadata     | Example: `/api/models/openai/gpt-4.json`                                               |
| `/api/i18n/{locale}/index.json`                                                                                        | Localized index               | Example: `https://basellm.github.io/llm-metadata/api/i18n/zh/index.json`               |
| `/api/i18n/{locale}/providers.json`                                                                                    | Localized providers           | Example: `https://basellm.github.io/llm-metadata/api/i18n/ja/providers.json`           |
| `/api/i18n/{locale}/all.json`                                                                                          | Localized full dataset        | Example: `https://basellm.github.io/llm-metadata/api/i18n/zh/all.json`                 |
| `/api/i18n/{locale}/providers/{providerId}.json`                                                                       | Localized provider details    | Example: `https://basellm.github.io/llm-metadata/api/i18n/zh/providers/openai.json`    |
| `/api/i18n/{locale}/models/{providerId}/{modelId}.json`                                                                | Localized model metadata      | Example: `https://basellm.github.io/llm-metadata/api/i18n/ja/models/openai/gpt-4.json` |
| `/api/i18n/{locale}/newapi/vendors.json`                                                                               | Localized NewAPI vendors      | Example: `https://basellm.github.io/llm-metadata/api/i18n/zh/newapi/vendors.json`      |
| `/api/i18n/{locale}/newapi/models.json`                                                                                | Localized NewAPI models       | Example: `https://basellm.github.io/llm-metadata/api/i18n/ja/newapi/models.json`       |

## 📊 Data Sources

- [models.dev/api.json](https://models.dev/api.json) - Primary data source
- BaseLLM Community Contributions - Supplements and corrections

## 📄 License

 AGPL-3.0 license - See [LICENSE](https://github.com/basellm/llm-metadata/blob/main/LICENSE)
