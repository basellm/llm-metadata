---
hide:
  - navigation
---

# LLM 元数据

一个用于发现与集成大语言模型（LLM）元数据的轻量级静态 API。

## 🌐 基础地址

| 站点             | Base URL                                  |
| ---------------- | ----------------------------------------- |
| GitHub Pages     | `https://basellm.github.io/llm-metadata/` |
| Cloudflare Pages | `https://llm-metadata.pages.dev/`         |

## 📡 API 接口

!!! info "说明"
    默认提供的语言有 `en`、`zh`、`ja`。

| 接口                                                    | 说明                 | 示例                                            |
| ------------------------------------------------------- | -------------------- | ----------------------------------------------- |
| `/api/index.json`                                       | 提供商与模型总览     | 获取所有提供商与模型的基础信息                  |
| `/api/providers.json`                                   | 提供商列表与统计     | 获取提供商列表以及模型数量统计                  |
| `/api/all.json`                                         | 完整模型数据集       | 获取所有模型的详细信息                          |
| `/api/newapi/ratio_config-v1-base.json`                 | New API 价格比率     | New API 系统用于价格计算的比率配置              |
| `/api/newapi/providers/{providerId}/ratio_config-v1-base.json` | 单一提供商的 New API 价格比率 | 示例：`/api/newapi/providers/anthropic/ratio_config-v1-base.json` |
| `/api/newapi/vendors.json`                              | New API 供应商数据   | 适配 New API 系统的供应商数据行                 |
| `/api/newapi/models.json`                               | New API 模型数据     | 适配 New API 系统的模型数据行                   |
| `/api/voapi/firms.json`                                 | VoAPI 供应商数据     | 适配 VoAPI 系统的供应商数据行                   |
| `/api/voapi/models.json`                                | VoAPI 模型数据       | 适配 VoAPI 系统的模型数据行                     |
| `/api/manifest.json`                                    | 构建清单与统计       | 构建信息与数据统计                              |
| `/api/providers/{providerId}.json`                      | 单个提供商详情       | 示例：`/api/providers/openai.json`              |
| `/api/models/{providerId}/{modelId}.json`               | 单个模型元数据       | 示例：`/api/models/openai/gpt-4.json`           |
| `/api/i18n/{locale}/index.json`                         | 本地化索引           | 示例：`../api/i18n/zh/index.json`               |
| `/api/i18n/{locale}/providers.json`                     | 本地化提供商列表     | 示例：`../api/i18n/ja/providers.json`           |
| `/api/i18n/{locale}/all.json`                           | 本地化完整数据集     | 示例：`../api/i18n/zh/all.json`                 |
| `/api/i18n/{locale}/providers/{providerId}.json`        | 本地化提供商详情     | 示例：`../api/i18n/zh/providers/openai.json`    |
| `/api/i18n/{locale}/models/{providerId}/{modelId}.json` | 本地化模型元数据     | 示例：`../api/i18n/ja/models/openai/gpt-4.json` |
| `/api/i18n/{locale}/newapi/vendors.json`                | 本地化 NewAPI 供应商 | 示例：`../api/i18n/zh/newapi/vendors.json`      |
| `/api/i18n/{locale}/newapi/models.json`                 | 本地化 NewAPI 模型   | 示例：`../api/i18n/ja/newapi/models.json`       |

## 📊 数据来源

- [models.dev/api.json](https://models.dev/api.json) - 主数据源
- BaseLLM 社区贡献 - 补充与修正

## 📄 许可证

AGPL-3.0 license - 参见 [LICENSE](https://github.com/basellm/llm-metadata/blob/main/LICENSE)
