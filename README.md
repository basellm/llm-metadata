# LLM Metadata

> A lightweight static API for discovering and integrating LLM metadata. Live API: [basellm.github.io/llm-metadata](https://basellm.github.io/llm-metadata/)

[中文文档](README.zh-CN.md) | English

High-throughput friendly, static-by-default interface: rebuild on change; serve static JSON via GitHub Pages.

Sources: [models.dev/api.json](https://models.dev/api.json) + basellm community contributions.

## Quick Start

Requirement: Node.js 18+ (with native `fetch`).

```bash
npm install
npm run build
```

Outputs: `dist/api/`

Scripts:

- `npm run build` — Compile TypeScript and build API (no-op if nothing changes)
- `npm run build:force` — Force rebuild all files
- `npm run check` — Dry-run for change detection (CI use)
- `npm run clean` — Remove `.cache` and `dist`
- `npm run compile` — Compile TypeScript only
- `npm run dev` — Watch mode compilation

## Update Modes

- Manual: edit `data/**` and push to main; CI builds and publishes
- Automatic: scheduled fetch; incremental updates for models allowed by policy

GitHub Actions triggers:

- `push` to `scripts/**`, `data/**`, etc.
- `workflow_dispatch` manual run
- `schedule` every 6 hours

## Auto-update Policy

Config: `data/policy.json` (default `auto=true`). Example:

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

If a model sets `auto=false`, automatic builds will not overwrite its existing static file (first build still generates it).

## Overrides

Config: `data/overrides.json`

```json
{
  "providers": {
    "openai": {
      "name": "OpenAI (custom)",
      "api": "https://api.openai.com",
      "doc": "https://platform.openai.com/docs",
      "icon": "https://example.com/icons/openai.svg",
      "lobeIcon": "OpenAI.Color"
    }
  },
  "models": {
    "openai/gpt-4o": {
      "description": "Optimized multimodal model with strong reasoning.",
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

Deep-merge: original fields preserved unless explicitly overridden.

- Provider-level overrides (e.g., `providers.deepseek.name`, `providers.deepseek.icon`, `providers.deepseek.lobeIcon`, `providers.deepseek.api`, `providers.deepseek.doc`)
  - Affects:
    - `dist/api/providers.json`
    - `dist/api/providers/<provider>.json`
    - `dist/api/all.json`
    - `dist/api/newapi/vendors.json`

- Model-level overrides (e.g., `models["deepseek/deepseek-reasoner"].description`, `tags`, `limit`, `modalities`, `cost`, `reasoning`, `tool_call`, `attachment`)
  - Affects:
    - `dist/api/all.json`
    - `dist/api/models/<provider>/<model>.json`
    - `dist/api/newapi/models.json`
