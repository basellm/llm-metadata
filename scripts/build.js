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
  // 为没有描述的模型生成默认描述
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

  ensureDirSync(CACHE_DIR);
  ensureDirSync(DIST_DIR);
  ensureDirSync(API_DIR);
  ensureDirSync(DATA_DIR);
  // 拷贝 public 到 dist 根
  copyDirSyncIfExists(path.join(ROOT, 'public'), DIST_DIR);

  const SOURCE_URL = 'https://models.dev/api.json';
  let source;
  try {
    source = await fetchJSON(SOURCE_URL);
  } catch (e) {
    // 离线或网络失败时，允许使用缓存继续构建
    const cachePath = path.join(CACHE_DIR, 'api.json');
    const cached = readJSONIfExists(cachePath);
    if (!cached) throw e;
    source = cached;
  }

  // 缓存源以便增量对比
  fs.writeFileSync(path.join(CACHE_DIR, 'api.json'), stableStringify(source), 'utf8');

  const { overrides, policy } = loadConfigFiles();
  const descriptions = readJSONSafe(path.join(DATA_DIR, 'descriptions.json'), { models: {} });

  const normalized = mapSourceToNormalized(source);

  // 注入 overrides 中新增的 provider/model（用于手动新增模型）
  for (const [pid, pov] of Object.entries(overrides.providers || {})) {
    if (!normalized.providers[pid]) {
      normalized.providers[pid] = deepMerge({ models: {} }, pov);
    }
  }

  const { providerIndex, modelIndex } = buildIndexes(normalized);

  // 统计同名模型在不同 provider 下的出现次数，用于 descriptions 未限定键的歧义判断
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

  // 写索引
  if (writeJSONIfChanged(path.join(API_DIR, 'index.json'), { providers: providerIndex, models: modelIndex }, { dryRun })) changes += 1;

  // 写单独的供应商信息接口
  if (writeJSONIfChanged(path.join(API_DIR, 'providers.json'), { providers: providerIndex }, { dryRun })) changes += 1;

  // 写完整模型信息（类似 models.dev/api.json 格式）
  const allModelsData = {};
  for (const [providerId, provider] of Object.entries(normalized.providers || {})) {
    const providerOut = applyOverrides(provider, overrides.providers?.[providerId]);
    allModelsData[providerId] = { ...providerOut };

    // 处理模型数据，应用 overrides 但保持原始结构
    const processedModels = {};
    const models = provider.models || {};
    for (const [modelId, modelData] of Object.entries(models)) {
      const key = modelKey(providerId, modelId);
      let processed = modelData;

      // 1) 确保所有模型都有 description 字段，先设置默认值
      if (!processed.description) {
        processed = deepMerge(processed, { description: generateDefaultDescription(processed.name || modelId, providerId) });
      }

      // 2) 应用描述覆盖
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

      // 应用 overrides
      processed = applyOverrides(processed, overrides.models?.[key]);
      processedModels[modelId] = processed;
    }

    allModelsData[providerId].models = processedModels;
  }

  if (writeJSONIfChanged(path.join(API_DIR, 'all.json'), allModelsData, { dryRun })) changes += 1;

  // 生成价格换算接口
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
        // 模型倍率 = 输入价格 ÷ 2 (基准价格2美元/1M tokens)
        priceConversionData.data.model_ratio[modelId] = cost.input / 2;

        // 缓存倍率 = 缓存读取价格 ÷ 输入价格
        if (typeof cost.cache_read === 'number' && cost.cache_read > 0) {
          priceConversionData.data.cache_ratio[modelId] = cost.cache_read / cost.input;
        }

        // 补全倍率 = 输出价格 ÷ 输入价格
        if (typeof cost.output === 'number' && cost.output > 0) {
          priceConversionData.data.completion_ratio[modelId] = cost.output / cost.input;
        }
      }
    }
  }

  if (writeJSONIfChanged(path.join(API_DIR, 'newapi-ratio_config-v1-base.json'), priceConversionData, { dryRun })) changes += 1;

  // 写 providers 与 models 详情，且支持 overrides 与 auto 策略
  for (const [providerId, provider] of Object.entries(normalized.providers || {})) {
    const safeProvider = sanitizeFileSegment(providerId);
    const providerOut = applyOverrides(provider, overrides.providers?.[providerId]);
    const providerPath = path.join(API_DIR, 'providers', `${safeProvider}.json`);
    if (writeJSONIfChanged(providerPath, providerOut, { dryRun })) changes += 1;

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

      // 1) 确保所有模型都有 description 字段，先设置默认值
      if (!next.description) {
        next = deepMerge(next, { description: generateDefaultDescription(next.name || modelId, providerId) });
      }

      // 2) 外部描述源覆盖（若存在）
      const descModelsMap = descriptions?.models || {};
      // 优先使用限定键 provider/model
      let descText;
      const descQualified = descModelsMap[key];
      if (descQualified !== undefined) {
        descText = typeof descQualified === 'string' ? descQualified : (descQualified && descQualified.description);
      } else {
        // 其次尝试未限定键 modelId（仅在该模型名全局唯一时生效）
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
      // 3) overrides.json 最高优先级
      next = applyOverrides(next, overrides.models?.[key]);

      if (!force && !allowAuto && existing) {
        // 自动模式下跳过；保留现有文件
        continue;
      }

      if (writeJSONIfChanged(existingPath, next, { dryRun })) changes += 1;
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
  if (writeJSONIfChanged(path.join(API_DIR, 'manifest.json'), manifest, { dryRun })) changes += 1;

  // 生成数据浏览页面的 Markdown
  const dataMarkdown = generateDataMarkdown(allModelsData, providerIndex, modelIndex, manifest);
  const dataMarkdownPath = path.join(ROOT, 'docs', 'data.md');
  if (writeMarkdownIfChanged(dataMarkdownPath, dataMarkdown, { dryRun })) changes += 1;

  if (dryRun) {
    if (changes > 0) {
      console.log(`[check] 将会更新 ${changes} 个文件`);
      process.exit(2); // 非零退出用于 CI 判断有变化
    } else {
      console.log('[check] 无需更新');
      process.exit(0);
    }
  } else {
    if (changes > 0) {
      console.log(`[build] 已更新 ${changes} 个文件`);
    } else {
      console.log('[build] 无需更新');
    }
  }
}

// 生成数据浏览页面的 Markdown
function generateDataMarkdown(allModelsData, providerIndex, modelIndex, manifest) {
  const stats = manifest.stats;
  const lastUpdated = new Date(manifest.generatedAt).toLocaleString('zh-CN');

  let markdown = `# 数据浏览

本页面展示了所有 LLM 提供商和模型的详细信息，数据从 API 自动生成。

!!! info "数据统计"
    - **提供商数量**: ${stats.providers}
    - **模型数量**: ${stats.models}
    - **最后更新**: ${lastUpdated}

!!! tip "使用说明"
    使用 MkDocs 顶部搜索栏可搜索任何提供商、模型名称或描述信息。

`;

  // 为每个提供商生成 Markdown 表格
  providerIndex.forEach(provider => {
    const providerData = allModelsData[provider.id];
    if (!providerData?.models) return;

    const models = Object.entries(providerData.models);
    if (models.length === 0) return;

    markdown += `## ${provider.name}\n\n`;

    // 添加提供商链接
    const links = [];
    if (providerData.api) links.push(`[📖 API 文档](${providerData.api})`);
    if (providerData.doc) links.push(`[📚 官方文档](${providerData.doc})`);
    if (links.length > 0) {
      markdown += `${links.join(' | ')}\n\n`;
    }

    // 生成模型表格
    markdown += `| 模型名称 | 描述 | 定价 | 能力 |\n`;
    markdown += `|----------|------|------|------|\n`;

    models.forEach(([modelId, model]) => {
      const name = (model.name || modelId).replace(/\|/g, '\\|');
      const description = (model.description || '-').replace(/\|/g, '\\|').replace(/\n/g, ' ');

      let pricing = '-';
      if (model.cost?.input) {
        const input = model.cost.input;
        const output = model.cost.output || '-';
        pricing = `输入: $${input}/1M<br/>输出: $${output}/1M`;
      }

      const capabilities = [];
      if (model.attachment) capabilities.push('📎');
      if (model.reasoning) capabilities.push('🧠');
      if (model.tool_call) capabilities.push('🔧');
      const capabilityStr = capabilities.length > 0 ? capabilities.join(' ') : '-';

      markdown += `| **${name}** | ${description} | ${pricing} | ${capabilityStr} |\n`;
    });

    markdown += '\n';
  });

  return markdown;
}

// 写入 Markdown 文件（如有变化）
function writeMarkdownIfChanged(filePath, content, options = {}) {
  const { dryRun = false } = options;

  ensureDirSync(path.dirname(filePath));

  const existing = readFileIfExists(filePath);
  if (existing === content) {
    return false; // 无变化
  }

  if (!dryRun) {
    fs.writeFileSync(filePath, content, 'utf8');
  }

  return true; // 有变化
}

// 读取文件（如果存在）
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