'use strict';

const fs = require('fs');
const path = require('path');
const {
  ensureDirSync,
  readJSONSafe,
  deepMerge,
  sha256OfObject,
  writeJSONIfChanged,
  stableStringify,
  readJSONIfExists,
  parseArgv,
  copyDirSyncIfExists,
  sanitizeFileSegment,
  removeNonJsonFiles,
} = require('./utils');

const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');
const API_DIR = path.join(DIST_DIR, 'api');
const CACHE_DIR = path.join(ROOT, '.cache');
const DATA_DIR = path.join(ROOT, 'data');

async function fetchJSON(url) {
  const res = await fetch(url, { headers: { 'accept': 'application/json' } });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${url}`);
  return res.json();
}

function modelKey(providerId, modelId) {
  return `${providerId}/${modelId}`;
}

function shouldAutoUpdate(policy, providerId, modelId) {
  const providerKey = providerId;
  const fullKey = modelKey(providerId, modelId);
  const defaultAuto = true;
  const p = policy.providers?.[providerKey]?.auto;
  const m = policy.models?.[fullKey]?.auto;
  if (typeof m === 'boolean') return m;
  if (typeof p === 'boolean') return p;
  return defaultAuto;
}

function applyOverrides(entity, override) {
  if (!override) return entity;
  return deepMerge(entity, override);
}

function generateDefaultDescription(modelName, providerId) {
  // Generate a default description for models without one
  return `${modelName} is an AI model provided by ${providerId}.`;
}

// Process model description with fallbacks and overrides
function processModelDescription(modelData, modelId, providerId, descriptions, overrides, modelNameCounts, warnings) {
  const key = modelKey(providerId, modelId);
  let processed = { ...modelData };

  // 1) Ensure every model has a description; set a default first
  if (!processed.description) {
    processed.description = generateDefaultDescription(processed.name || modelId, providerId);
  }

  // 2) Apply description override from external sources
  const descModelsMap = descriptions?.models || {};
  const descQualified = descModelsMap[key];
  if (descQualified !== undefined) {
    const descText = typeof descQualified === 'string' ? descQualified : (descQualified && descQualified.description);
    if (descText) {
      processed.description = descText;
    }
  } else {
    // Try unqualified key modelId (only when globally unique)
    const descUnqualified = descModelsMap[modelId];
    if (descUnqualified !== undefined) {
      const count = modelNameCounts[modelId] || 0;
      if (count <= 1) {
        const descText = typeof descUnqualified === 'string' ? descUnqualified : (descUnqualified && descUnqualified.description);
        if (descText) {
          processed.description = descText;
        }
      } else {
        warnings.push(`Ambiguous description key '${modelId}' matches ${count} models; ignored. Use '${key}'.`);
      }
    }
  }

  // 3) Apply overrides.json (highest precedence)
  return applyOverrides(processed, overrides.models?.[key]);
}

// Calculate NewAPI ratios for a model
function calculateNewApiRatios(cost) {
  if (!cost?.input || typeof cost.input !== 'number' || cost.input <= 0) {
    return null;
  }

  const ratios = {
    model: cost.input / 2, // baseline $2 per 1M tokens
    completion: null,
    cache: null
  };

  if (typeof cost.output === 'number' && cost.output > 0) {
    ratios.completion = cost.output / cost.input;
  }

  if (typeof cost.cache_read === 'number' && cost.cache_read > 0) {
    ratios.cache = cost.cache_read / cost.input;
  }

  return ratios;
}

// Format NewAPI ratios for display
function formatNewApiRatios(ratios) {
  if (!ratios) return '-';

  const parts = [];
  parts.push(`Model: ${ratios.model.toFixed(2)}×`);

  if (ratios.completion !== null) {
    parts.push(`Completion: ${ratios.completion.toFixed(2)}×`);
  }

  if (ratios.cache !== null) {
    parts.push(`Cache: ${ratios.cache.toFixed(2)}×`);
  }

  return parts.join('<br/>');
}

// Format pricing information for display
function formatPricing(cost) {
  if (!cost?.input) return '-';

  const input = cost.input;
  const output = cost.output || '-';
  const cache = cost.cache_read ? `<br/>Cache: ${cost.cache_read}` : '';

  return `In: ${input}<br/>Out: ${output}${cache}`;
}

// Format capabilities for display
function formatCapabilities(model) {
  const capabilities = [];
  if (model.attachment) capabilities.push('📎 Files');
  if (model.reasoning) capabilities.push('🧠 Reasoning');
  if (model.tool_call) capabilities.push('🔧 Tools');
  if (model.temperature) capabilities.push('🌡️ Temp');

  return capabilities.length > 0 ? capabilities.join('<br/>') : '-';
}

// Format modalities for display
function formatModalities(modalities) {
  const inputMods = modalities?.input?.join(', ') || 'text';
  const outputMods = modalities?.output?.join(', ') || 'text';
  return `In: ${inputMods}<br/>Out: ${outputMods}`;
}

// Format additional details for display
function formatDetails(model) {
  const details = [];
  if (model.open_weights) details.push('Open Weights');
  if (model.release_date) details.push(`Released: ${model.release_date}`);
  if (model.last_updated && model.last_updated !== model.release_date) {
    details.push(`Updated: ${model.last_updated}`);
  }

  return details.length > 0 ? details.join('<br/>') : '-';
}

// Format context/output limits for display
function formatLimit(value) {
  return value ? `${(value / 1000).toFixed(0)}K` : '-';
}

// Escape pipe characters for markdown table safety
function escapeMarkdownPipes(text) {
  return (text || '').replace(/\|/g, '\\|');
}

function mapSourceToNormalized(source) {
  // Expect a structure similar to models.dev api.json
  // Keep original keys but normalize slices we need
  const providers = source;
  return { providers };
}

function buildIndexes(normalized) {
  const providers = normalized.providers || {};
  const providerIndex = [];
  const modelIndex = [];
  for (const [pid, provider] of Object.entries(providers)) {
    const pInfo = {
      id: pid,
      name: provider.name || pid,
      api: provider.api || null,
      doc: provider.doc || null,
      modelCount: 0,
    };
    const models = provider.models || {};
    for (const [mid, m] of Object.entries(models)) {
      pInfo.modelCount += 1;
      modelIndex.push({
        id: mid,
        providerId: pid,
        name: m.name || mid,
        updated: m.last_updated || m.release_date || null,
        flags: {
          attachment: !!m.attachment,
          reasoning: !!m.reasoning,
          tool_call: !!m.tool_call,
        },
      });
    }
    providerIndex.push(pInfo);
  }
  providerIndex.sort((a, b) => a.id.localeCompare(b.id));
  modelIndex.sort((a, b) =>
    a.providerId.localeCompare(b.providerId) || a.id.localeCompare(b.id)
  );
  return { providerIndex, modelIndex };
}

function loadConfigFiles() {
  const overrides = readJSONSafe(path.join(DATA_DIR, 'overrides.json'), { providers: {}, models: {} });
  const policy = readJSONSafe(path.join(DATA_DIR, 'policy.json'), { providers: {}, models: {} });
  return { overrides, policy };
}

function computeManifest({ sourceHash, overridesHash, policyHash, stats }) {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    sourceHash,
    overridesHash,
    policyHash,
    stats,
  };
}

async function main() {
  const args = parseArgv(process.argv);
  const dryRun = !!args.check;
  const force = !!args.force;
  const docsMdOnly = !!args['docs-md-only'] || !!args.docsMdOnly;
  const apiOnly = !!args['api-only'] || !!args.apiOnly;

  ensureDirSync(CACHE_DIR);
  ensureDirSync(DATA_DIR);
  if (!docsMdOnly) {
    ensureDirSync(DIST_DIR);
    ensureDirSync(API_DIR);
    // Copy public directory into dist root
    copyDirSyncIfExists(path.join(ROOT, 'public'), DIST_DIR);
  }

  const SOURCE_URL = 'https://models.dev/api.json';
  let source;
  try {
    source = await fetchJSON(SOURCE_URL);
  } catch (e) {
    // Allow using cached source when offline or the network fails
    const cachePath = path.join(CACHE_DIR, 'api.json');
    const cached = readJSONIfExists(cachePath);
    if (!cached) throw e;
    source = cached;
  }

  // Cache source for incremental diffing
  fs.writeFileSync(path.join(CACHE_DIR, 'api.json'), stableStringify(source), 'utf8');

  const { overrides, policy } = loadConfigFiles();
  const descriptions = readJSONSafe(path.join(DATA_DIR, 'descriptions.json'), { models: {} });

  const normalized = mapSourceToNormalized(source);

  // Inject providers/models added via overrides (allow manual additions)
  for (const [pid, pov] of Object.entries(overrides.providers || {})) {
    if (!normalized.providers[pid]) {
      normalized.providers[pid] = deepMerge({ models: {} }, pov);
    }
  }

  const { providerIndex, modelIndex } = buildIndexes(normalized);

  // Count duplicate model ids across providers to disambiguate unqualified description keys
  const modelNameCounts = {};
  for (const [, provider] of Object.entries(normalized.providers || {})) {
    const models = provider.models || {};
    for (const mid of Object.keys(models)) {
      modelNameCounts[mid] = (modelNameCounts[mid] || 0) + 1;
    }
  }

  const sourceHash = sha256OfObject(source);
  const overridesHash = sha256OfObject(overrides);
  const policyHash = sha256OfObject(policy);

  let changes = 0;
  const warnings = [];

  // Write indexes
  if (!docsMdOnly && writeJSONIfChanged(path.join(API_DIR, 'index.json'), { providers: providerIndex, models: modelIndex }, { dryRun })) changes += 1;

  // Write provider summary endpoint
  if (!docsMdOnly && writeJSONIfChanged(path.join(API_DIR, 'providers.json'), { providers: providerIndex }, { dryRun })) changes += 1;

  // Write complete models dataset (models.dev-like)
  const allModelsData = {};
  for (const [providerId, provider] of Object.entries(normalized.providers || {})) {
    const providerOut = applyOverrides(provider, overrides.providers?.[providerId]);
    allModelsData[providerId] = { ...providerOut };

    // Process model data; apply overrides while preserving the original structure
    const processedModels = {};
    const models = provider.models || {};
    for (const [modelId, modelData] of Object.entries(models)) {
      processedModels[modelId] = processModelDescription(modelData, modelId, providerId, descriptions, overrides, modelNameCounts, warnings);
    }

    allModelsData[providerId].models = processedModels;
  }

  if (!docsMdOnly && writeJSONIfChanged(path.join(API_DIR, 'all.json'), allModelsData, { dryRun })) changes += 1;

  // Generate price conversion endpoints
  const priceConversionData = {
    data: {
      cache_ratio: {},
      completion_ratio: {},
      model_ratio: {}
    },
    message: "",
    success: true
  };

  for (const provider of Object.values(normalized.providers || {})) {
    const models = provider.models || {};
    for (const [modelId, modelData] of Object.entries(models)) {
      const ratios = calculateNewApiRatios(modelData.cost);
      if (ratios) {
        priceConversionData.data.model_ratio[modelId] = ratios.model;
        if (ratios.completion !== null) {
          priceConversionData.data.completion_ratio[modelId] = ratios.completion;
        }
        if (ratios.cache !== null) {
          priceConversionData.data.cache_ratio[modelId] = ratios.cache;
        }
      }
    }
  }

  if (!docsMdOnly && writeJSONIfChanged(path.join(API_DIR, 'newapi-ratio_config-v1-base.json'), priceConversionData, { dryRun })) changes += 1;

  // Write provider and models details honoring overrides and auto policy
  for (const [providerId, provider] of Object.entries(normalized.providers || {})) {
    const safeProvider = sanitizeFileSegment(providerId);
    const providerOut = applyOverrides(provider, overrides.providers?.[providerId]);
    const providerPath = path.join(API_DIR, 'providers', `${safeProvider}.json`);
    if (!docsMdOnly && writeJSONIfChanged(providerPath, providerOut, { dryRun })) changes += 1;

    const providerModelsDir = path.join(API_DIR, 'models', safeProvider);
    ensureDirSync(providerModelsDir);
    removeNonJsonFiles(providerModelsDir, { dryRun });

    const models = provider.models || {};
    for (const [modelId, modelData] of Object.entries(models)) {
      const key = modelKey(providerId, modelId);

      const allowAuto = shouldAutoUpdate(policy, providerId, modelId);
      const safeModel = sanitizeFileSegment(modelId);
      const existingPath = path.join(providerModelsDir, `${safeModel}.json`);
      const existing = readJSONIfExists(existingPath);

      let next = processModelDescription(modelData, modelId, providerId, descriptions, overrides, modelNameCounts, warnings);

      if (!force && !allowAuto && existing) {
        // Skip in non-auto mode; keep existing file
        continue;
      }

      if (!docsMdOnly && writeJSONIfChanged(existingPath, next, { dryRun })) changes += 1;
    }
  }

  const manifest = computeManifest({
    sourceHash,
    overridesHash,
    policyHash,
    stats: {
      providers: providerIndex.length,
      models: modelIndex.length,
      filesChanged: changes,
      dryRun,
    },
  });
  if (warnings.length > 0) {
    manifest.warnings = warnings;
    for (const w of warnings) console.warn('[warn]', w);
  }
  if (!docsMdOnly && writeJSONIfChanged(path.join(API_DIR, 'manifest.json'), manifest, { dryRun })) changes += 1;

  // Generate data browser Markdown (unless --api-only)
  if (!apiOnly) {
    const dataMarkdown = generateDataMarkdown(allModelsData, providerIndex, modelIndex, manifest);
    const dataMarkdownPath = path.join(ROOT, 'docs', 'data.md');
    if (writeTextIfChanged(dataMarkdownPath, dataMarkdown, { dryRun })) changes += 1;
  }

  const mode = dryRun ? 'check' : 'build';
  const hasChanges = changes > 0;
  const action = dryRun ? (hasChanges ? 'Will update' : 'No changes') : (hasChanges ? 'Updated' : 'No changes');
  const message = hasChanges ? `${action} ${changes} file(s)` : action;

  console.log(`[${mode}] ${message}`);

  if (dryRun) {
    process.exit(hasChanges ? 2 : 0); // Non-zero exit for CI to detect changes
  }
}

// Generate data browser page Markdown
function generateDataMarkdown(allModelsData, providerIndex, modelIndex, manifest) {
  const { stats } = manifest;
  const lastUpdated = new Date(manifest.generatedAt).toLocaleString('en-US');

  let markdown = `---
hide:
  - navigation
---

# Data Browser

This page displays comprehensive information about all LLM providers and models, automatically generated from API data.

!!! info "Statistics"
    - **Provider Count**: ${stats.providers}
    - **Model Count**: ${stats.models}
    - **Last Updated**: ${lastUpdated}
`;

  // Generate a Markdown table for each provider
  providerIndex.forEach(provider => {
    const providerData = allModelsData[provider.id];
    if (!providerData?.models) return;

    const models = Object.entries(providerData.models);
    if (models.length === 0) return;

    markdown += `## ${provider.name}\n\n`;

    // Add provider links if available
    const links = [
      providerData.api && `[📖 API Address](${providerData.api})`,
      providerData.doc && `[📚 Official Documentation](${providerData.doc})`
    ].filter(Boolean);

    if (links.length > 0) {
      markdown += `${links.join(' | ')}\n\n`;
    }

    // Generate comprehensive models table
    const headers = ['Model', 'Context', 'Output', 'Pricing ($/1M)', 'NewAPI Ratios', 'Capabilities', 'Knowledge', 'Modalities', 'Details'];
    const separators = ['-------', '---------', '--------', '----------------', '---------------', '--------------', '-----------', '------------', '----------'];

    markdown += `| ${headers.join(' | ')} |\n`;
    markdown += `|${separators.join('|')}|\n`;

    models.forEach(([modelId, model]) => {
      const fields = [
        `**${escapeMarkdownPipes(model.name || modelId)}**`,
        formatLimit(model.limit?.context),
        formatLimit(model.limit?.output),
        formatPricing(model.cost),
        formatNewApiRatios(calculateNewApiRatios(model.cost)),
        formatCapabilities(model),
        model.knowledge || '-',
        formatModalities(model.modalities),
        formatDetails(model)
      ];

      markdown += `| ${fields.join(' | ')} |\n`;
    });

    markdown += '\n';
  });

  return markdown;
}

// Write text file if content has changed
function writeTextIfChanged(filePath, content, { dryRun = false } = {}) {
  ensureDirSync(path.dirname(filePath));

  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
  const isChanged = existing !== content;

  if (!dryRun && isChanged) {
    fs.writeFileSync(filePath, content, 'utf8');
  }

  return isChanged;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});