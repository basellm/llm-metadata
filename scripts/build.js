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
      const key = modelKey(providerId, modelId);
      let processed = modelData;

      // 1) Ensure every model has a description; set a default first
      if (!processed.description) {
        processed = deepMerge(processed, { description: generateDefaultDescription(processed.name || modelId, providerId) });
      }

      // 2) Apply description override
      const descModelsMap = descriptions?.models || {};
      const descQualified = descModelsMap[key];
      if (descQualified !== undefined) {
        const descText = typeof descQualified === 'string' ? descQualified : (descQualified && descQualified.description);
        if (descText) {
          processed = deepMerge(processed, { description: descText });
        }
      } else {
        const descUnqualified = descModelsMap[modelId];
        if (descUnqualified !== undefined) {
          const count = modelNameCounts[modelId] || 0;
          if (count <= 1) {
            const descText = typeof descUnqualified === 'string' ? descUnqualified : (descUnqualified && descUnqualified.description);
            if (descText) {
              processed = deepMerge(processed, { description: descText });
            }
          }
        }
      }

      // Apply overrides
      processed = applyOverrides(processed, overrides.models?.[key]);
      processedModels[modelId] = processed;
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

  for (const [providerId, provider] of Object.entries(normalized.providers || {})) {
    const models = provider.models || {};
    for (const [modelId, modelData] of Object.entries(models)) {
      const cost = modelData.cost;
      if (cost && typeof cost.input === 'number' && cost.input > 0) {
        // Model ratio = input price / 2 (baseline $2 per 1M tokens)
        priceConversionData.data.model_ratio[modelId] = cost.input / 2;
        // Cache ratio = cache_read / input
        if (typeof cost.cache_read === 'number' && cost.cache_read > 0) {
          priceConversionData.data.cache_ratio[modelId] = cost.cache_read / cost.input;
        }
        // Completion ratio = output / input
        if (typeof cost.output === 'number' && cost.output > 0) {
          priceConversionData.data.completion_ratio[modelId] = cost.output / cost.input;
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

      let next = modelData;

      // 1) Ensure every model has a description; set a default first
      if (!next.description) {
        next = deepMerge(next, { description: generateDefaultDescription(next.name || modelId, providerId) });
      }

      // 2) External description source override (if present)
      const descModelsMap = descriptions?.models || {};
      // Prefer qualified key provider/model
      let descText;
      const descQualified = descModelsMap[key];
      if (descQualified !== undefined) {
        descText = typeof descQualified === 'string' ? descQualified : (descQualified && descQualified.description);
      } else {
        // Otherwise try unqualified key modelId (only when globally unique)
        const descUnqualified = descModelsMap[modelId];
        if (descUnqualified !== undefined) {
          const count = modelNameCounts[modelId] || 0;
          if (count <= 1) {
            descText = typeof descUnqualified === 'string' ? descUnqualified : (descUnqualified && descUnqualified.description);
          } else {
            warnings.push(`Ambiguous description key '${modelId}' matches ${count} models; ignored. Use '${key}'.`);
          }
        }
      }
      if (descText) {
        next = deepMerge(next, { description: descText });
      }
      // 3) overrides.json has the highest precedence
      next = applyOverrides(next, overrides.models?.[key]);

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
    if (writeMarkdownIfChanged(dataMarkdownPath, dataMarkdown, { dryRun })) changes += 1;
  }

  if (dryRun) {
    if (changes > 0) {
      console.log(`[check] Will update ${changes} file(s)`);
      process.exit(2); // Non-zero exit for CI to detect changes
    } else {
      console.log('[check] No changes');
      process.exit(0);
    }
  } else {
    if (changes > 0) {
      console.log(`[build] Updated ${changes} file(s)`);
    } else {
      console.log('[build] No changes');
    }
  }
}

// Generate data browser page Markdown
function generateDataMarkdown(allModelsData, providerIndex, modelIndex, manifest) {
  const stats = manifest.stats;
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

    // Add provider links
    const links = [];
    if (providerData.api) links.push(`[📖 API Address](${providerData.api})`);
    if (providerData.doc) links.push(`[📚 Official Documentation](${providerData.doc})`);
    if (links.length > 0) {
      markdown += `${links.join(' | ')}\n\n`;
    }

    // Generate comprehensive models table
    markdown += `| Model | Context | Output | Pricing ($/1M) | Capabilities | Knowledge | Modalities | Details |\n`;
    markdown += `|-------|---------|--------|----------------|--------------|-----------|------------|----------|\n`;

    models.forEach(([modelId, model]) => {
      const name = (model.name || modelId).replace(/\|/g, '\\|');

      // Context and output limits
      const contextLimit = model.limit?.context ? `${(model.limit.context / 1000).toFixed(0)}K` : '-';
      const outputLimit = model.limit?.output ? `${(model.limit.output / 1000).toFixed(0)}K` : '-';

      // Pricing information
      let pricing = '-';
      if (model.cost?.input) {
        const input = model.cost.input.toFixed(3);
        const output = model.cost.output ? model.cost.output.toFixed(3) : '-';
        const cache = model.cost.cache_read ? `<br/>Cache: ${model.cost.cache_read.toFixed(3)}` : '';
        pricing = `In: ${input}<br/>Out: ${output}${cache}`;
      }

      // Capabilities
      const capabilities = [];
      if (model.attachment) capabilities.push('📎 Files');
      if (model.reasoning) capabilities.push('🧠 Reasoning');
      if (model.tool_call) capabilities.push('🔧 Tools');
      if (model.temperature) capabilities.push('🌡️ Temp');
      const capabilityStr = capabilities.length > 0 ? capabilities.join('<br/>') : '-';

      // Knowledge cutoff
      const knowledge = model.knowledge || '-';

      // Modalities
      const inputMods = model.modalities?.input?.join(', ') || 'text';
      const outputMods = model.modalities?.output?.join(', ') || 'text';
      const modalities = `In: ${inputMods}<br/>Out: ${outputMods}`;

      // Additional details
      const details = [];
      if (model.open_weights) details.push('Open Weights');
      if (model.release_date) details.push(`Released: ${model.release_date}`);
      if (model.last_updated && model.last_updated !== model.release_date) {
        details.push(`Updated: ${model.last_updated}`);
      }
      const detailsStr = details.length > 0 ? details.join('<br/>') : '-';

      markdown += `| **${name}** | ${contextLimit} | ${outputLimit} | ${pricing} | ${capabilityStr} | ${knowledge} | ${modalities} | ${detailsStr} |\n`;
    });

    markdown += '\n';
  });

  return markdown;
}

// Write Markdown file if content has changed
function writeMarkdownIfChanged(filePath, content, options = {}) {
  const { dryRun = false } = options;

  ensureDirSync(path.dirname(filePath));

  const existing = readFileIfExists(filePath);
  if (existing === content) {
    return false; // No changes
  }

  if (!dryRun) {
    fs.writeFileSync(filePath, content, 'utf8');
  }

  return true; // Content changed
}

// Read file if it exists
function readFileIfExists(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return null;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});