## LLM Metadata

轻量级的 LLM 元数据访问与集成接口，支持：

- 手动编辑仓库文件后，自动构建更新静态接口
- 定时监测 `models.dev` 源数据，按“模型级开关”增量更新静态接口

数据来源：[`https://models.dev/api.json`](https://models.dev/api.json)

### 快速开始

1. 安装 Node.js 18+（内置 fetch）
2. 克隆仓库后执行：

```bash
npm run build
```

生成的静态接口位于 `dist/api/`：

- `dist/api/index.json`：模型与提供方摘要索引
- `dist/api/providers/{providerId}.json`：单个提供方与其模型列表
- `dist/api/models/{providerId}/{modelId}.json`：单个模型的细粒度元数据
- `dist/api/manifest.json`：构建清单（源哈希、配置哈希、统计信息）

### 两种更新模式

- 手动模式：直接修改 `data/overrides.json` 或 `data/policy.json` 等文件并推送到主分支，GitHub Actions 将自动构建并提交 `dist/` 的变更
- 自动模式：工作流按计划抓取 [`https://models.dev/api.json`](https://models.dev/api.json)，仅对允许自动更新的模型写入增量更新；若最终无变化，将不产生提交

### 模型级开关（自动/跳过）

配置文件：`data/policy.json`

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

- 默认：`auto = true`
- 如果某模型配置为 `auto = false`，则在自动模式下将保留其现有静态文件（不会被新抓取的数据覆盖）；首次构建仍会从源生成

### 元数据覆盖（overrides）

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

覆盖策略为“深度合并”，不会移除原始字段，只会覆盖同名字段或追加对象属性。

### 模型描述（外部或手动）

配置文件：`data/descriptions.json`

支持两种格式：

```json
{
  "models": {
    "xai/grok-4": "描述文本（简写）",
    "deepseek/deepseek-reasoner": { "description": "描述文本（对象写法）" }
  }
}
```

合并优先级：`descriptions.json` 写入 `description` 字段 → 再应用 `overrides.json`（若也包含 `description` 则以 overrides 为最终值）。

重复模型名策略：

- 如果多个提供方存在相同 `modelId`，则简写键（仅写 `modelId`）将被忽略，避免歧义；请使用限定键 `providerId/modelId`
- 若简写键只有全局唯一匹配时才会生效
- 构建会将冲突信息写入 `dist/api/manifest.json.warnings` 并在日志中输出提醒

### 常用脚本

- `npm run build`：抓取源并构建（如无变化则不改写文件）
- `npm run build:force`：强制重建
- `npm run check`：仅检查是否会产生输出变更（退出码可用于 CI 判断）
- `npm run clean`：清理 `.cache` 与 `dist`

### GitHub Actions（自动与手动触发）

- Push 到主分支/修改 `data/**`、`scripts/**` 等文件会触发构建
- `workflow_dispatch` 可手动触发
- `schedule` 定时抓取源，若有变化则提交更新

### 发布到 GitHub Pages

1. 在仓库 Settings → Pages：
   - Source 选择 “GitHub Actions”
2. 推送到主分支或手动运行 “Build static API” 工作流
3. 工作流会：
   - 构建 `dist/`
   - 上传 Pages 工件并自动部署
4. 访问地址：仓库 Pages 域名（例如 `https://<org>.github.io/<repo>/`）
   - 接口路径示例：
     - `/api/index.json`
     - `/api/providers/xai.json`
     - `/api/models/xai/grok-4.json`

### 许可

MIT
