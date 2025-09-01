# LLM Metadata

一个轻量级的静态 API，用于发现和集成大语言模型（LLM）的元数据信息。

## 📡 API 端点

| 端点 | 描述 | 示例 |
|------|------|------|
| [`/api/index.json`](./api/index.json) | 提供商和模型概览 | 获取所有提供商和模型的基本信息 |
| [`/api/providers.json`](./api/providers.json) | 提供商列表及统计 | 获取提供商列表和模型数量统计 |
| [`/api/all.json`](./api/all.json) | 完整模型数据 | 获取所有模型的详细信息 |
| [`/api/newapi-ratio_config-v1-base.json`](./api/newapi-ratio_config-v1-base.json) | New API 价格倍率 | 用于 New API 系统的价格计算 |
| [`/api/manifest.json`](./api/manifest.json) | 构建清单和统计 | 构建信息和数据统计 |
| `/api/providers/{providerId}.json` | 单个提供商详情 | 如：`/api/providers/openai.json` |
| `/api/models/{providerId}/{modelId}.json` | 单个模型元数据 | 如：`/api/models/openai/gpt-4.json` |

## 📊 数据来源

- [models.dev/api.json](https://models.dev/api.json) - 主要数据源
- BaseLLM 社区贡献 - 补充和修正

## 📄 许可证

MIT License - 详见 [LICENSE](https://github.com/basellm/llm-metadata/blob/main/LICENSE)
