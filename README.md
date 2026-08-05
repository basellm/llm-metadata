# LLM Metadata

> A lightweight static API for discovering and integrating LLM metadata. Live:
> [GitHub Pages](https://basellm.github.io/llm-metadata/) · [Cloudflare Pages](https://llm-metadata.pages.dev/)

English | [中文文档](README.zh-CN.md) | [日本語](README.ja.md)

High-throughput friendly, static-by-default interface: rebuild on change; serve static JSON via GitHub Pages. The live site ships a minimal pricing browser (`web/`, Vite + React + Tailwind + shadcn/ui) rendering per-provider model price tables straight from the static API.

Sources: [models.dev/api.json](https://models.dev/api.json) + basellm community contributions, filtered to native (first-party) providers via `data/native-providers.json`.

## Quick Start

Requirement: Node.js 20.19+ (API build works on 18+; the web UI toolchain requires 20.19+).

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
- `npm run web:dev` — Pricing UI dev server (run `npm run build` once first so `dist/api` exists)
- `npm run web:build` — Build the pricing UI into `dist/` (run `npm install` in `web/` first)

## Native Providers

The upstream models.dev dataset mixes first-party providers with aggregators, resellers, and cloud hosts. The build keeps only native (first-party) providers — the companies that actually create the models — so every published price is an official one.

Catalog: `data/native-providers.json`

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

- `providers` — allowlist. Providers not listed here are dropped from every output (JSON API, NewAPI, VoAPI, web UI), and their previously generated files are pruned from `dist/api/`.
- `excludeModels` — case-insensitive regexes that drop third-party models hosted on a native provider (e.g., DeepSeek models resold on Alibaba's platform), keeping only the provider's own models.
- `priority` — resolves model-ID conflicts across regional/plan endpoints of the same vendor (e.g., `zai` vs `zhipuai`) in the aggregated NewAPI outputs; the highest value wins, ties break by provider ID. Per-provider files under `/api/newapi/providers/<id>/` always keep that provider's own prices.
- `exchangeRates` — currency units per 1 USD, used to normalize non-USD costs (e.g., CNY) into the USD-based NewAPI ratio system (1 ratio = $2 per 1M input tokens). Models with an unknown currency are skipped from pricing outputs with a build warning.
- If the file is missing, filtering is disabled and the build emits a warning.

NewAPI compatibility: `dist/api/newapi/ratio_config-v1-base.json` follows new-api's `/api/ratio_config` payload and is consumed by new-api's built-in "official ratio preset" in its upstream ratio sync UI; `vendors.json` / `models.json` feed its model metadata sync.

Expression billing (`tiered_expr`): models with length-tiered pricing (e.g., `input_32k_128k`) or thinking-mode differential pricing (`thinking_input` / `thinking_output`) additionally emit `billing_mode` / `billing_expr` maps in the ratio config, generated as expr-lang expressions with USD-per-1M coefficients (`len`-based tier ternaries wrapped in `tier()`, thinking mode gated by `param("enable_thinking")`). new-api prefers the expression over ratios when applied; plain ratios are still emitted as a fallback.

## Internationalization (API)

API i18n is driven by `i18n/locales.json` (language list), `i18n/api/*.json` (capability labels and default description templates), and overrides in `data/overrides/**`.

### Folder & config

```
i18n/
  locales.json          # language list (source of truth)
  api/
    en.json             # capability labels + default description template
    zh.json
    ja.json
```

### Add a language (example: `fr`)

1. Add to `i18n/locales.json`:

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

2. Create `i18n/api/fr.json` (translate capability labels and optional default description template)
3. Build: `npm run build`

### API i18n details

- Capability labels come from `i18n/api/<locale>.json` and are applied to:
  - explicit `model.tags`
  - boolean capabilities: tools/files/reasoning/temperature/open_weights
  - modalities-derived tags: vision/audio
- Localized API datasets are written to:
  - `dist/api/i18n/<locale>/all.json`
  - `dist/api/i18n/<locale>/providers.json`, `index.json`
  - per-provider/model files under `dist/api/i18n/<locale>/{providers,models}/...`
- NewAPI payloads:
  - English (stable): `dist/api/newapi/{vendors.json,models.json}`
  - Localized: `dist/api/i18n/<locale>/newapi/{vendors.json,models.json}`
- Default description template (fallback to English):
  - `i18n/api/<locale>.json` → `defaults.model_description`, placeholders: `${modelName}`, `${providerId}`
  - If a model's description equals the English default, localized builds replace it with the locale template

## Update Modes

- Manual: edit `data/**` and push to main; CI builds and publishes
- Automatic: scheduled fetch; incremental updates for models allowed by policy

GitHub Actions triggers:

- `push` to `src/**`, `data/**`, `web/**`, etc.
- `workflow_dispatch` manual run
- `schedule` daily

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

## Overrides (directory-based)

Use a directory-based layout. Put small JSON fragments under the following paths and they will be deep-merged during build:

```
data/
  overrides/
    providers/
      <providerId>.json            # provider-level overrides (e.g., lobeIcon, iconURL, name, api, doc)
    models/
      <providerId>/<modelId>.json  # model-level overrides (description, limit, modalities, cost, flags)
    i18n/
      providers/<providerId>.json  # optional: localized name/description for providers
      models/<providerId>/<modelId>.json  # optional: localized name/description for models
```

Examples

Provider icon override (`data/overrides/providers/openai.json`):

```json
{
  "lobeIcon": "OpenAI.Color"
}
```

Model override (`data/overrides/models/openai/gpt-4o.json`):

```json
{
  "description": "Optimized multimodal model with strong reasoning.",
  "limit": { "context": 131072, "output": 8192 },
  "modalities": { "input": ["text", "image"], "output": ["text"] },
  "reasoning": true,
  "tool_call": true,
  "attachment": false
}
```

Notes

- Deep-merge applies; unspecified fields are preserved.
- Model override allowlist (sanitization): `id`, `name`, `description`, `reasoning`, `tool_call`, `attachment`, `temperature`, `knowledge`, `release_date`, `last_updated`, `open_weights`, `modalities`, `limit`, `cost`.
- Build reads overrides from `data/overrides/**`.
