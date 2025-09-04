# LLM Metadata

> A lightweight static API for discovering and integrating LLM metadata. Live:
> [GitHub Pages](https://basellm.github.io/llm-metadata/) · [Cloudflare Pages](https://llm-metadata.pages.dev/)

English | [中文文档](README.zh-CN.md) | [日本語](README.ja.md)

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

## Internationalization (Docs & API)

Docs i18n is driven by `i18n/docs/*.json` and `i18n/locales.json` with mkdocs-static-i18n; API i18n is driven by `i18n/api/*.json` and overrides in `data/overrides/**`.

### Folder & config

```
i18n/
  locales.json          # language list (source of truth)
  docs/
    en.json             # UI strings for docs (fallback)
    zh.json
    ja.json
  api/
    en.json             # capability labels + default description template
    zh.json
    ja.json
docs/
  en/ index.md data.md
  zh/ index.md data.md
  ja/ index.md data.md
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

2. Create `i18n/docs/fr.json` (copy from `en.json` and translate keys)
3. Create `i18n/api/fr.json` (translate capability labels and optional default description template)
4. Add `docs/fr/index.md` (landing) and an empty `docs/fr/data.md` (will be generated)
5. Optional: in `mkdocs.yml` add nav_translations for `fr`
6. Build: `npm run build`

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

### Docs i18n (mkdocs)

- Strings from `i18n/docs/<locale>.json`; missing keys fall back to `en.json`
- Build docs pages `docs/<locale>/data.md` automatically on `npm run build`
- Preview docs: `pip install -r requirements.txt` then `mkdocs serve`

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
