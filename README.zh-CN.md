# LLM Metadata

> 轻量级的 LLM 元数据“静态 API”。线上地址：[basellm.github.io/llm-metadata →](https://basellm.github.io/llm-metadata/)

中文文档 | [English](README.md)

面向高并发的静态接口：仅在源数据或配置变化时重建，其余时间通过 GitHub Pages 提供静态 JSON。

数据来源：[models.dev/api.json](https://models.dev/api.json) + basellm 社区贡献。

## 在线接口（Live API）

- 基础地址：`https://basellm.github.io/llm-metadata/`
- 端点：
  - `/api/index.json`：提供方与模型摘要索引
  - `/api/all.json`：完整模型数据聚合（等价于 models.dev 结构，已应用描述/覆写）
  - `/api/newapi/ratio_config-v1-base.json`：New API 系统家族的价格倍率配置
  - `/api/manifest.json`：构建清单与统计
  - `/api/providers/{providerId}.json`：单个提供方详情
  - `/api/models/{providerId}/{modelId}.json`：单个模型元数据

## 功能特性

- 静态构建：只在变化时输出，适配大流量静态托管
- 增量更新：按模型级策略控制是否参与自动更新
- 元数据覆写：深度合并 `overrides.json`
- 模型描述：支持外部/手动描述，缺省自动生成默认描述
- 文件名安全：跨平台文件名清洗与历史无效文件清理

## 快速开始

要求：Node.js 18+（内置 `fetch`）

```bash
npm run build
```

产物位置：`dist/api/`

常用脚本：

- `npm run build`：构建（如无变化则不改写文件）
- `npm run build:force`：强制重建
- `npm run check`：仅检查是否会产生输出变更（CI 可用）
- `npm run clean`：清理 `.cache` 与 `dist`

## 更新模式

- 手动模式：直接编辑 `data/**`，推送到主分支后 CI 自动构建与发布
- 自动模式：按计划抓取上游，检测变化后仅对允许自动更新的模型增量写入

触发策略（GitHub Actions 已配置）：

- push 到 `scripts/**`、`data/**` 等路径
- `workflow_dispatch` 手动触发
- `schedule` 每 6 小时定时

## 自动更新策略（模型级开关）

配置文件：`data/policy.json`（默认 `auto=true`）。示例：

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

当某模型 `auto=false` 时，自动模式不会覆盖其现有静态文件（首次构建仍会生成）。

## 覆写（Overrides）

配置文件：`data/overrides.json`

```json
{
  "providers": {
    "deepseek": { "displayName": "DeepSeek（自定义名称）" }
  },
  "models": {
    "deepseek/deepseek-reasoner": { "tags": ["reasoning", "math"] }
  }
}
```

覆写采用“深度合并”，不移除原字段，仅覆盖同名字段或追加对象属性。

## 描述（Descriptions）

配置文件：`data/descriptions.json`，两种写法：

```json
{
  "models": {
    "xai/grok-4": "描述文本（简写）",
    "deepseek/deepseek-reasoner": { "description": "描述文本（对象写法）" }
  }
}
```

优先级：默认描述 → `descriptions.json` → `overrides.json`（最终）。

重复 `modelId` 的歧义处理：多提供方同名时，简写键（仅 `modelId`）被忽略，请使用 `providerId/modelId`；警告会写入 `dist/api/manifest.json`。

## 价格倍率（Pricing Ratios，New API 系统家族）

端点：`/api/newapi/ratio_config-v1-base.json`

用于 New API 系统家族的价格倍率，按每 1M tokens 价格换算：

- `model_ratio = input_price / 2`（基准价 2 美元/1M）
- `cache_ratio = cache_read / input_price`
- `completion_ratio = output / input_price`

仅当字段存在且 > 0 时生成对应倍率。

## 发布到 GitHub Pages

仓库 Settings → Pages 选择 “GitHub Actions”。工作流会：

1. 构建 `dist/`
2. 上传 Pages 工件并自动部署
3. 访问地址：[basellm.github.io/llm-metadata](https://basellm.github.io/llm-metadata/)

## 许可协议

MIT


