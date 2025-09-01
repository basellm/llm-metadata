# LLM Metadata

> 轻量级的 LLM 元数据“静态 API”。线上地址：[basellm.github.io/llm-metadata →](https://basellm.github.io/llm-metadata/)

中文文档 | [English](README.md)

面向高并发的静态接口：仅在源数据或配置变化时重建，其余时间通过 GitHub Pages 提供静态 JSON。

数据来源：[models.dev/api.json](https://models.dev/api.json) + basellm 社区贡献。

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
