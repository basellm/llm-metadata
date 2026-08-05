# LLM Metadata

> 轻量级的 LLM 元数据“静态 API”。线上地址：
> [GitHub Pages](https://basellm.github.io/llm-metadata/) · [Cloudflare Pages](https://llm-metadata.pages.dev/)

[中文文档](README.zh-CN.md) | [English](README.md) | [日本語](README.ja.md)

面向高并发的静态接口：仅在源数据或配置变化时重建，其余时间通过 GitHub Pages 提供静态 JSON。线上站点内置一个极简价格浏览器（`web/`，Vite + React + Tailwind + shadcn/ui），直接读取静态 API 渲染各供应商的模型价格表。

数据来源：[models.dev/api.json](https://models.dev/api.json) + basellm 社区贡献，并经 `data/native-providers.json` 过滤，仅保留原生（第一方）供应商。

## 快速开始

要求：Node.js 20.19+（API 构建兼容 18+；web UI 工具链需要 20.19+）

```bash
npm install
npm run build
```

产物位置：`dist/api/`

常用脚本：

- `npm run build`：编译 TypeScript 并构建 API（如无变化则不改写文件）
- `npm run build:force`：强制重建所有文件
- `npm run check`：仅检查是否会产生输出变更（CI 可用）
- `npm run clean`：清理 `.cache` 与 `dist`
- `npm run compile`：仅编译 TypeScript
- `npm run dev`：监听模式编译
- `npm run web:dev`：价格 UI 开发服务器（需先执行一次 `npm run build` 生成 `dist/api`）
- `npm run web:build`：构建价格 UI 到 `dist/`（需先在 `web/` 目录执行 `npm install`）

## 原生供应商

上游 models.dev 数据混杂了第一方供应商与聚合商、转售商、云托管平台。构建时只保留原生（第一方）供应商——即真正研发这些模型的公司，确保发布的每个价格都是官方原生价格。

目录配置：`data/native-providers.json`

```json
{
  "version": 1,
  "exchangeRates": { "CNY": 7.3, "EUR": 0.92 },
  "providers": {
    "openai": {},
    "zai": { "priority": 20 },
    "alibaba": { "priority": 30, "excludeModels": ["^deepseek", "^kimi"] }
  }
}
```

- `providers`——白名单。未列出的供应商会从所有输出（JSON API、NewAPI、VoAPI、Web UI）中移除，其历史产物也会在构建时从 `dist/api/` 清理。
- `excludeModels`——不区分大小写的正则，用于剔除原生供应商平台上托管的第三方模型（例如阿里平台上转售的 DeepSeek 模型），只保留自研模型。
- `priority`——解决同一厂商多端点（如 `zai` 与 `zhipuai`）在聚合 NewAPI 输出中的同名模型冲突；数值大者胜出，相同时按供应商 ID 排序。`/api/newapi/providers/<id>/` 下的按供应商文件始终保留该供应商自己的价格。
- `exchangeRates`——每 1 USD 对应的货币数量，用于将非美元价格（如人民币）换算进 NewAPI 的美元倍率体系（1 倍率 = $2 / 1M 输入 tokens）。缺少汇率的货币会跳过价格输出并给出构建警告。
- 若该文件缺失，过滤将被禁用并输出构建警告。

NewAPI 兼容性：`dist/api/newapi/ratio_config-v1-base.json` 遵循 new-api 的 `/api/ratio_config` 载荷格式，是 new-api 倍率同步界面内置"官方倍率预设"的数据源；`vendors.json` / `models.json` 供其模型元数据同步使用。

表达式计费（`tiered_expr`）：具有长度分层定价（如 `input_32k_128k`）或思考模式差价（`thinking_input` / `thinking_output`）的模型，会在倍率配置中额外输出 `billing_mode` / `billing_expr` 映射，表达式为 expr-lang 语法、系数单位 USD/1M tokens（`len` 三元链 + `tier()` 档位包裹，思考模式经 `param("enable_thinking")` 判定）。new-api 应用后表达式优先于倍率生效；普通倍率仍会同时输出作为回退。

## 国际化（API）

API i18n 由 `i18n/locales.json`（语言清单）、`i18n/api/*.json`（能力标签与默认描述模板）以及 `data/overrides/**` 驱动。

### 目录与配置

```
i18n/
  locales.json          # 语言清单（唯一真相来源）
  api/
    en.json             # 能力标签 + 默认描述模板
    zh.json
    ja.json
```

### 新增语言（以 `fr` 为例）

1）在 `i18n/locales.json` 增加：

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

2）复制 `i18n/api/en.json` 为 `i18n/api/fr.json` 并翻译（包含 capability labels 与默认描述模板）
3）构建：`npm run build`

### API i18n 细节

- 能力标签来自 `i18n/api/<locale>.json`，应用于：
  - 显式 `model.tags`
  - 布尔能力：tools/files/reasoning/temperature/open_weights
  - 模态衍生标签：vision/audio
- 本地化 API 数据输出：
  - `dist/api/i18n/<locale>/all.json`
  - `dist/api/i18n/<locale>/providers.json`、`index.json`
  - 拆分文件：`dist/api/i18n/<locale>/{providers,models}/...`
- NewAPI 载荷：
  - 英文（稳定）：`dist/api/newapi/{vendors.json,models.json}`
  - 本地化：`dist/api/i18n/<locale>/newapi/{vendors.json,models.json}`
- 默认描述模板（支持占位符）：
  - `i18n/api/<locale>.json` → `defaults.model_description`，占位 `${modelName}`、`${providerId}`
  - 若某模型描述等于英文默认描述，本地化构建将自动替换为对应语言模板

## 更新模式

- 手动模式：直接编辑 `data/**`，推送到主分支后 CI 自动构建与发布
- 自动模式：按计划抓取上游，检测变化后仅对允许自动更新的模型增量写入

触发策略（GitHub Actions 已配置）：

- push 到 `src/**`、`data/**`、`web/**` 等路径
- `workflow_dispatch` 手动触发
- `schedule` 每天定时

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

## 覆写（Overrides，目录化）

已从单一 `data/overrides.json` 迁移为目录化结构，避免多人同时修改时的冲突。将小型 JSON 片段放入如下目录，构建时会深度合并：

```
data/
  overrides/
    providers/
      <providerId>.json            # 提供商级覆写（如 lobeIcon、iconURL、name、api、doc）
    models/
      <providerId>/<modelId>.json  # 模型级覆写（description、limit、modalities、cost、能力标记等）
    i18n/
      providers/<providerId>.json  # 可选：提供商名称/描述本地化
      models/<providerId>/<modelId>.json  # 可选：模型名称/描述本地化
```

示例：

提供商图标（`data/overrides/providers/openai.json`）：

```json
{ "lobeIcon": "OpenAI.Color" }
```

模型覆写（`data/overrides/models/openai/gpt-4o.json`）：

```json
{
  "description": "面向多模态、具备较强推理能力的优化模型。",
  "limit": { "context": 131072, "output": 8192 },
  "modalities": { "input": ["text", "image"], "output": ["text"] },
  "reasoning": true,
  "tool_call": true,
  "attachment": false
}
```

说明：

- 使用深度合并；未声明字段会保持原值。
- 模型覆写字段白名单（会进行清洗）：`id`、`name`、`description`、`reasoning`、`tool_call`、`attachment`、`temperature`、`knowledge`、`release_date`、`last_updated`、`open_weights`、`modalities`、`limit`、`cost`。
- 仅从 `data/overrides/**` 读取。
