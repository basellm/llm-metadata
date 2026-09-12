# LLM Metadata

> 轻量级的 LLM 元数据“静态 API”。线上地址：
> [GitHub Pages](https://basellm.github.io/llm-metadata/) · [Cloudflare Pages](https://llm-metadata.pages.dev/)

[中文文档](README.zh-CN.md) | [English](README.md) | [日本語](README.ja.md)

面向高并发的静态接口：仅在源数据或配置变化时重建，其余时间通过 GitHub Pages 提供静态 JSON。线上站点内置一个极简价格浏览器（`web/`，Vite + React + Tailwind + shadcn/ui），直接读取静态 API 渲染各供应商的模型价格表，支持浅色/深色主题（默认跟随系统）与中/英/日三语界面。

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

- `providers`——白名单。未列出的供应商会从所有输出（JSON API、NewAPI、VoAPI、Web UI）中移除，其历史产物也会在构建时从 `dist/api/` 清理。
- `excludeModels`——不区分大小写的正则，用于剔除原生供应商平台上托管的第三方模型（例如阿里平台上转售的 DeepSeek 模型），只保留自研模型。
- `priority`——解决同一厂商多端点（如 `zai` 与 `zhipuai`）在聚合 NewAPI 输出中的同名模型冲突；数值大者胜出，相同时按供应商 ID 排序。`/api/newapi/providers/<id>/` 下的按供应商文件始终保留该供应商自己的价格。
- `exchangeRates`——每 1 USD 对应的货币数量，用于将非美元价格（如人民币）换算为 NewAPI 计费表达式中的美元系数。缺少汇率的货币会跳过价格输出并给出构建警告。
- `thinkingToggle`——该供应商混合推理模型切换到思考模式的请求体字段（gjson 路径）与取值。当模型 `cost.reasoning` 与 `cost.output` 不同时，表达式以 `param("<param>") == <value>` 为条件按 reasoning 价计输出 tokens；未配置时按 output 价计费并给出构建警告。
- `cacheWrite1h`——1 小时 TTL 提示缓存写入价相对输入价的倍数（Anthropic 为 2）。在 `cc`（models.dev 的 `cache_write` 价）旁额外输出 `cc1h` 项；否则 new-api 对 Claude 格式用量的 1h 缓存写入不计费。
- `lobeIcon`——[@lobehub/icons](https://github.com/lobehub/lobe-icons) 的导出名（如 `Claude.Color`），作为 NewAPI `vendors.json` 中的厂商图标。
- 若该文件缺失，过滤将被禁用并输出构建警告。

供应商 logo 会在构建时镜像到 `dist/api/logos/<id>.svg`，Web UI 以同源地址加载图标（远程 `iconURL` 与首字母徽标作为回退），不再热链 models.dev。

## NewAPI 计费表达式

`dist/api/newapi/ratio_config-v1-base.json` 遵循 new-api 的 `/api/ratio_config` 载荷格式，是 new-api 倍率同步界面内置"官方倍率预设"的数据源；按供应商版本位于 `/api/newapi/providers/<id>/`。`vendors.json` / `models.json` 只承载元数据（描述、标签、厂商、图标），供 new-api 的模型元数据同步使用。

所有有价模型均以 new-api 计费表达式发布（`billing_mode: "tiered_expr"` + `billing_expr`）——倍率配置中不再含 `model_ratio` / `completion_ratio` / `cache_ratio` / `model_price` 字段。表达式为 expr-lang 语法，系数为 USD/1M tokens 实价，每个价格叶子以 `tier("<name>", …)` 包裹：

| 定价形态                              | 来源字段                                                    | 表达式                                                                                                                 |
| ------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 单一价                                | `input`、`output`、`cache_read`、`cache_write`、`*_audio`   | `tier("standard", p * 3 + cr * 0.3 + cc * 3.75 + cc1h * 6 + c * 15)`                                                   |
| 上下文阶梯                            | `tiers[]`（`context_over_200k` 为遗留回退）                 | `len <= 200000 ? tier("0_200k", …) : tier("200k_plus", …)`                                                             |
| 思考模式（供应商 `thinkingToggle`）   | `reasoning` ≠ `output`                                      | `param("enable_thinking") == true ? tier("thinking", p * 0.4 + c * 4) : tier("standard", p * 0.4 + c * 1.2)`            |
| 分时段（波峰/波谷）                   | `schedule`（覆写扩展，见下文）                              | `weekday("UTC") >= 1 && weekday("UTC") <= 5 && ((hour("UTC") >= 1 && hour("UTC") < 4) \|\| …) ? tier("peak", …) : tier("off_peak", …)` |
| 按图                                  | `per_image`（无 token 价时）                                | `tier("image", fixed(0.04)) * image_count`                                                                             |

分支自外向内为 时段 → 思考模式 → 上下文阶梯，与 new-api 价格页面可结构化展示的形状一致（时段条件显示为 "Mon–Fri 01:00–04:00 or 06:00–10:00 (UTC)" 等）。显式 0 价保留为 `cr * 0` 等项，因为 new-api 只在表达式引用对应变量时才把缓存/音频 tokens 从 `p`/`c` 中剔除。无法表达的价格（如没有开关的独立推理 token 价）仍按文档输出价生成表达式，并在 `manifest.json` 的 warnings 中记录。

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

分时段定价（`data/overrides/models/deepseek/deepseek-flash.json`）——`cost.schedule` 是本仓库对 models.dev 成本结构的扩展，用于有波峰/波谷价的供应商：

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

- 基础 `cost` 价格在所有窗口之外生效，档位名为 `fallback`；窗口按顺序匹配，可覆盖任意价格家族（未给出的家族沿用基础价）。带上下文 `tiers` 的模型，其窗口必须自带 `tiers`。
- `timezone` 为 IANA 时区；`weekdays` 采用 0 = 周日 … 6 = 周六；`hours` 为 `HH:MM-HH:MM`（结束不含，允许 `24:00`），结束早于开始表示跨午夜。整点窗口生成 new-api 可结构化展示的 `hour(tz)` 比较；含分钟的窗口生成按分钟数的算式。
- 非法的时段配置会明确失败：该模型不输出表达式，原因记录在 `manifest.json` 的 warnings 中。

说明：

- 使用深度合并；未声明字段会保持原值。覆写中请固定所有依赖的价格（含 `reasoning`），避免上游变动导致窗口价与基础价不一致。
- 模型覆写字段白名单（会进行清洗）：`id`、`name`、`description`、`reasoning`、`tool_call`、`attachment`、`temperature`、`knowledge`、`release_date`、`last_updated`、`open_weights`、`modalities`、`limit`、`cost`。`$comment` 等键会被丢弃，可安全用作维护备注。
- 仅从 `data/overrides/**` 读取。
