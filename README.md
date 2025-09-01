# LLM Metadata

> A lightweight static API for discovering and integrating LLM metadata. Live API: [basellm.github.io/llm-metadata](https://basellm.github.io/llm-metadata/)

[中文文档](README.zh-CN.md) | English

High-throughput friendly, static-by-default interface: rebuild on change; serve static JSON via GitHub Pages.

Sources: [models.dev/api.json](https://models.dev/api.json) + basellm community contributions.

## Quick Start

Requirement: Node.js 18+ (with native `fetch`).

```bash
npm run build
```

Outputs: `dist/api/`

Scripts:

- `npm run build` — Build (no-op if nothing changes)
- `npm run build:force` — Force rebuild
- `npm run check` — Dry-run for change detection (CI)
- `npm run clean` — Remove `.cache` and `dist`

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
    "deepseek": { "displayName": "DeepSeek (custom)" }
  },
  "models": {
    "deepseek/deepseek-reasoner": { "tags": ["reasoning", "math"] }
  }
}
```

Deep-merge: original fields preserved unless explicitly overridden.
