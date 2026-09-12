# LLM Metadata

> A lightweight static API for discovering and integrating LLM metadata. Live:
> [GitHub Pages](https://basellm.github.io/llm-metadata/) · [Cloudflare Pages](https://llm-metadata.pages.dev/)

English | [中文文档](README.zh-CN.md) | [日本語](README.ja.md)

High-throughput friendly, static-by-default interface: rebuild on change; serve static JSON via GitHub Pages. The live site ships a minimal pricing browser (`web/`, Vite + React + Tailwind + shadcn/ui) rendering per-provider model price tables straight from the static API, with light/dark themes (system-following by default) and an English/Chinese/Japanese UI.

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

- `providers` — allowlist. Providers not listed here are dropped from every output (JSON API, NewAPI, VoAPI, web UI), and their previously generated files are pruned from `dist/api/`.
- `excludeModels` — case-insensitive regexes that drop third-party models hosted on a native provider (e.g., DeepSeek models resold on Alibaba's platform), keeping only the provider's own models.
- `priority` — resolves model-ID conflicts across regional/plan endpoints of the same vendor (e.g., `zai` vs `zhipuai`) in the aggregated NewAPI outputs; the highest value wins, ties break by provider ID. Per-provider files under `/api/newapi/providers/<id>/` always keep that provider's own prices.
- `exchangeRates` — currency units per 1 USD, used to normalize non-USD costs (e.g., CNY) into the USD coefficients of NewAPI billing expressions. Models with an unknown currency are skipped from pricing outputs with a build warning.
- `thinkingToggle` — request-body field (gjson path) and value that switch the provider's hybrid models into thinking mode. When a model's `cost.reasoning` differs from `cost.output`, the expression bills completion tokens at the reasoning price behind `param("<param>") == <value>`. Without it the output price applies and the build warns.
- `cacheWrite1h` — 1-hour-TTL prompt-cache write price as a multiple of the input price (Anthropic: 2). Emits a `cc1h` term next to `cc` (the models.dev `cache_write` price); new-api otherwise leaves 1h cache writes unpriced for Claude-format usage.
- `lobeIcon` — [@lobehub/icons](https://github.com/lobehub/lobe-icons) export name (e.g., `Claude.Color`) used as the vendor icon in NewAPI `vendors.json`.
- If the file is missing, filtering is disabled and the build emits a warning.

Provider logos are mirrored at build time to `dist/api/logos/<id>.svg`, so the web UI loads icons same-origin (with the remote `iconURL` and a monogram as fallbacks) instead of hotlinking models.dev.

## NewAPI Billing Expressions

`dist/api/newapi/ratio_config-v1-base.json` follows new-api's `/api/ratio_config` payload and is consumed by new-api's built-in "official ratio preset" in its upstream ratio sync UI; per-provider variants live under `/api/newapi/providers/<id>/`. `vendors.json` / `models.json` carry metadata only (description, tags, vendor, icon) and feed new-api's model metadata sync.

Every priced model is published as a new-api billing expression (`billing_mode: "tiered_expr"` + `billing_expr`) — the ratio config contains no `model_ratio` / `completion_ratio` / `cache_ratio` / `model_price` fields. Expressions use expr-lang syntax with real USD-per-1M-token coefficients and every price leaf wrapped in `tier("<name>", …)`:

| Pricing shape                              | Source fields                                                | Expression                                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Flat                                       | `input`, `output`, `cache_read`, `cache_write`, `*_audio`    | `tier("standard", p * 3 + cr * 0.3 + cc * 3.75 + cc1h * 6 + c * 15)`                                                 |
| Context tiers                              | `tiers[]` (`context_over_200k` as legacy fallback)           | `len <= 200000 ? tier("0_200k", …) : tier("200k_plus", …)`                                                           |
| Thinking mode (provider `thinkingToggle`)  | `reasoning` ≠ `output`                                       | `param("enable_thinking") == true ? tier("thinking", p * 0.4 + c * 4) : tier("standard", p * 0.4 + c * 1.2)`          |
| Time-of-day windows                        | `schedule` (override extension, see below)                   | `weekday("UTC") >= 1 && weekday("UTC") <= 5 && ((hour("UTC") >= 1 && hour("UTC") < 4) \|\| …) ? tier("peak", …) : tier("off_peak", …)` |
| Per image                                  | `per_image` (no token price)                                 | `tier("image", fixed(0.04)) * image_count`                                                                           |

Branches nest schedule → thinking → context tiers, matching the shapes new-api's pricing UI renders structurally (time-window conditions display as e.g. "Mon–Fri 01:00–04:00 or 06:00–10:00 (UTC)"). Explicit zero prices are kept as `cr * 0` etc., because new-api only excludes cache/audio tokens from `p`/`c` when the expression references their variable. Models whose only price cannot be expressed (e.g., separately priced reasoning tokens without a toggle) still get an expression at the documented output price plus a build warning listed in `manifest.json`.

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

Time-of-day pricing (`data/overrides/models/deepseek/deepseek-flash.json`) — `cost.schedule` is a repository extension of the models.dev cost schema for providers with peak/off-peak rates:

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

- Base `cost` prices apply outside every window and are labelled `fallback`; windows are matched in order and may override any price family (missing families inherit the base price). A window on a model with context `tiers` must define its own `tiers`.
- `timezone` is an IANA zone; `weekdays` uses 0 = Sunday … 6 = Saturday; `hours` entries are `HH:MM-HH:MM` with an exclusive end (`24:00` allowed), and an end before the start wraps past midnight. Whole-hour windows compile to `hour(tz)` comparisons that new-api displays structurally; minute-precision windows compile to minute-of-day arithmetic.
- Invalid schedules fail loudly: the model is left without an expression and the reason is listed in `manifest.json` warnings.

Notes

- Deep-merge applies; unspecified fields are preserved. Pin every price you depend on inside the override (including `reasoning`) so upstream changes cannot make the window prices inconsistent with the base.
- Model override allowlist (sanitization): `id`, `name`, `description`, `reasoning`, `tool_call`, `attachment`, `temperature`, `knowledge`, `release_date`, `last_updated`, `open_weights`, `modalities`, `limit`, `cost`. Keys such as `$comment` are dropped, so they are safe for maintainer notes.
- Build reads overrides from `data/overrides/**`.
