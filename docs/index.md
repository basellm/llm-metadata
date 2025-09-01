---
hide:
  - navigation
---

# LLM Metadata

A lightweight static API for discovering and integrating large language model (LLM) metadata.

## 📡 API Endpoints

| Endpoint | Description | Example |
|----------|-------------|---------|
| [`/api/index.json`](./api/index.json) | Provider and model overview | Get basic information about all providers and models |
| [`/api/providers.json`](./api/providers.json) | Provider list and statistics | Get provider list and model count statistics |
| [`/api/all.json`](./api/all.json) | Complete model dataset | Get detailed information for all models |
| [`/api/newapi/ratio_config-v1-base.json`](./api/newapi/ratio_config-v1-base.json) | New API price ratios | Price calculation ratios for New API system |
| [`/api/newapi/vendors.json`](./api/newapi/vendors.json) | NewAPI vendors payload | Vendor rows adapted for NewAPI system |
| [`/api/newapi/models.json`](./api/newapi/models.json) | NewAPI models payload | Model rows adapted for NewAPI system |
| [`/api/manifest.json`](./api/manifest.json) | Build manifest and statistics | Build information and data statistics |
| `/api/providers/{providerId}.json` | Individual provider details | Example: `/api/providers/openai.json` |
| `/api/models/{providerId}/{modelId}.json` | Individual model metadata | Example: `/api/models/openai/gpt-4.json` |

## 📊 Data Sources

- [models.dev/api.json](https://models.dev/api.json) - Primary data source
- BaseLLM Community Contributions - Supplements and corrections

## 📄 License

MIT License - See [LICENSE](https://github.com/basellm/llm-metadata/blob/main/LICENSE)
