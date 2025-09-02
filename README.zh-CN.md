# LLM Metadata

> 轻量级的 LLM 元数据“静态 API”。线上地址：[basellm.github.io/llm-metadata →](https://basellm.github.io/llm-metadata/)

中文文档 | [English](README.md)

面向高并发的静态接口：仅在源数据或配置变化时重建，其余时间通过 GitHub Pages 提供静态 JSON。

数据来源：[models.dev/api.json](https://models.dev/api.json) + basellm 社区贡献。

## 快速开始

要求：Node.js 18+（内置 `fetch`）

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

## 国际化（文档与 API）

文档 i18n 由 `i18n/docs/*.json` 与 `i18n/locales.json` 驱动，并通过 mkdocs-static-i18n 发布；API i18n 由 `i18n/api/*.json` 与 `data/overrides.json` 驱动。

### 目录与配置

```
i18n/
  locales.json          # 语言清单（唯一真相来源）
  docs/
    en.json             # 文档 UI 词条（兜底）
    zh.json
    ja.json
  api/
    en.json             # 能力标签 + 默认描述模板
    zh.json
    ja.json
docs/
  en/ index.md data.md
  zh/ index.md data.md
  ja/ index.md data.md
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

2）复制 `i18n/docs/en.json` 为 `i18n/docs/fr.json` 并翻译
3）复制 `i18n/api/en.json` 为 `i18n/api/fr.json` 并翻译（包含 capability labels 与默认描述模板）
4）添加 `docs/fr/index.md` 与空白 `docs/fr/data.md`（构建时自动生成）
5）可选：在 `mkdocs.yml` 为 `fr` 添加 `nav_translations`
6）构建：`npm run build`

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

### 文档 i18n（mkdocs）

- 词条来自 `i18n/docs/<locale>.json`；缺失键自动回退英文
- `npm run build` 自动输出 `docs/<locale>/data.md`
- 预览文档：`pip install -r requirements.txt` 后执行 `mkdocs serve`

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
    "openai": {
      "name": "OpenAI（自定义）",
      "api": "https://api.openai.com",
      "doc": "https://platform.openai.com/docs",
      "icon": "https://example.com/icons/openai.svg",
      "lobeIcon": "OpenAI.Color"
    }
  },
  "models": {
    "openai/gpt-4o": {
      "description": "面向多模态、具备较强推理能力的优化模型。",
      "tags": ["vision", "tools"],
      "limit": { "context": 131072, "output": 8192 },
      "modalities": { "input": ["text", "image"], "output": ["text"] },
      "reasoning": true,
      "tool_call": true,
      "attachment": false
    }
  }
}
```

覆写采用“深度合并”，不移除原字段，仅覆盖同名字段或追加对象属性。

- Provider 级覆写（例如：`providers.deepseek.name`、`providers.deepseek.icon`、`providers.deepseek.lobeIcon`、`providers.deepseek.api`、`providers.deepseek.doc`）
  - 影响：
    - `dist/api/providers.json`
    - `dist/api/providers/<provider>.json`
    - `dist/api/all.json`
    - `dist/api/newapi/vendors.json`

- Model 级覆写（例如：`models["deepseek/deepseek-reasoner"].description`、`tags`、`limit`、`modalities`、`cost`、`reasoning`、`tool_call`、`attachment`）
  - 影响：
    - `dist/api/all.json`
    - `dist/api/models/<provider>/<model>.json`
    - `dist/api/newapi/models.json`
