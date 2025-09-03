(function () {
  const root = document.getElementById('model-submit');
  if (!root) return;
  const repo = root.getAttribute('data-repo') || 'basellm/llm-metadata';
  const API_BASE = (root.getAttribute('data-api') || 'https://basellm.github.io/llm-metadata/api').replace(/\/$/, '');
  const lang = (root.getAttribute('data-lang') || 'en').toLowerCase();

  // Get i18n from global scope (loaded from external file)
  const I18N = window.SubmitFormI18N || {};

  // Utility functions
  const t = (key) => (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
  const $ = (id) => document.getElementById(id);
  const $$ = (selector) => document.querySelectorAll(selector);
  const value = (id) => ($(id)?.value || '').trim();
  const num = (id) => { const v = value(id); return v ? Number(v) : undefined; };
  const checked = (id) => !!$(id)?.checked;
  const gather = (className) => Array.from($$('.' + className)).filter(x => x.checked).map(x => x.value);
  const getMode = () => $$('input[name="mode"]:checked')[0]?.value || 'single';
  const getAction = () => $$('input[name="action"]:checked')[0]?.value || 'create';

  // DOM manipulation helpers
  const setOpenIssueEnabled = (enabled) => { const btn = $('open-issue'); if (btn) btn.disabled = !enabled; };
  const setStatus = (msg, isError = false) => {
    const el = $('status');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('error', isError && !!msg);
  };
  const setHTML = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
  const setText = (id, text) => { const el = $(id); if (el) el.textContent = text; };
  const setValue = (id, val) => {
    const el = $(id);
    if (!el || val === undefined || val === null) return;
    const s = typeof val === 'string' ? val : String(val);
    if (s.trim() !== '') el.value = s;
  };

  // Parse and validate batch JSON once, reuse for preview and submit gate
  function parseAndValidateBatch() {
    const raw = (value('batch-json') || '').trim();
    if (!raw) return { valid: false, models: [], error: t('batchCannotBeEmpty') };
    try {
      const parsed = JSON.parse(raw);
      const models = Array.isArray(parsed) ? parsed : [parsed];
      const errs = validateBatchModels(models);
      if (!models.length) return { valid: false, models, error: t('batchCannotBeEmpty') };
      if (errs.length) return { valid: false, models, error: `${t('batchValidateFailed')}: ${errs[0]}` };
      return { valid: true, models, error: '' };
    } catch (e) {
      return { valid: false, models: [], error: `${t('batchJsonError')}: ${e.message}` };
    }
  }

  function validateSingleRequired() {
    const pid = value('providerId');
    const mid = value('id');
    if (!pid) { setStatus(t('providerRequired'), true); return false; }
    if (!mid) { setStatus(t('modelRequired'), true); return false; }
    setStatus('');
    return true;
  }

  function validateBatchModels(models) {
    const errors = [];
    (models || []).forEach((m, i) => {
      if (!m || typeof m !== 'object') { errors.push(`${i + 1}. ${t('batchInvalidItem')}`); return; }
      if (!m.providerId) errors.push(`${i + 1}. ${t('batchMissingProvider')}`);
      if (!m.id) errors.push(`${i + 1}. ${t('batchMissingId')}`);
    });
    return errors;
  }

  function ensureValidBeforeSubmit() {
    const mode = getMode();
    if (mode !== 'batch') return validateSingleRequired();
    const result = parseAndValidateBatch();
    if (!result.valid) {
      setStatus(result.error, true);
      return false;
    }
    setStatus('');
    return true;
  }

  // Object pruning utility
  const prune = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const out = Array.isArray(obj) ? [] : {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined || v === null) continue;
      if (typeof v === 'string' && v.trim() === '') continue;
      if (Array.isArray(v) && v.length === 0) continue;
      if (typeof v === 'object') {
        const pv = prune(v);
        if (pv === undefined || (typeof pv === 'object' && !Array.isArray(pv) && Object.keys(pv).length === 0)) continue;
        out[k] = pv;
      } else { out[k] = v; }
    }
    return out;
  };

  function buildPayload() {
    const mode = getMode();
    if (mode === 'batch') {
      try {
        const batchText = value('batch-json');
        if (!batchText) return [];
        const parsed = JSON.parse(batchText);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (_) { return []; }
    }

    return prune({
      schema: 'model-submission',
      action: getAction(),
      providerId: value('providerId') || undefined,
      id: value('id') || undefined,
      // name/description removed in favor of i18n-only inputs
      i18n: {
        name: {
          en: value('i18n-name-en') || undefined,
          zh: value('i18n-name-zh') || undefined,
          ja: value('i18n-name-ja') || undefined,
        },
        description: {
          en: value('i18n-desc-en') || undefined,
          zh: value('i18n-desc-zh') || undefined,
          ja: value('i18n-desc-ja') || undefined,
        }
      },
      reasoning: checked('cap-reasoning') || undefined,
      tool_call: checked('cap-tools') || undefined,
      attachment: checked('cap-files') || undefined,
      temperature: checked('cap-temp') || undefined,
      knowledge: value('knowledge') || undefined,
      release_date: value('release-date') || undefined,
      last_updated: value('last-updated') || undefined,
      open_weights: checked('cap-open-weights') || undefined,
      modalities: { input: gather('mod-in'), output: gather('mod-out') },
      limit: { context: num('limit-context'), output: num('limit-output') },
      cost: { input: num('cost-input'), output: num('cost-output'), cache_read: num('cost-cache-read'), cache_write: num('cost-cache-write') },
    });
  }

  // API utilities
  const fetchJSON = async (url) => {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };
  const fetchFirstOk = async (urls) => {
    for (const url of urls) { try { return await fetchJSON(url); } catch (_) { } }
    throw new Error('All fetch candidates failed');
  };
  const modelIdVariants = (modelId) => {
    const v = String(modelId || '');
    const underscore = v.replace(/:/g, '_');
    return Array.from(new Set([underscore, v].filter(Boolean)));
  };
  const normalizeId = (id) => String(id || '').replace(/:/g, '_');

  const extractProviderList = (data) => {
    if (Array.isArray(data)) return data.map(x => x.id || x.name || x.providerId || x.key).filter(Boolean);
    if (data?.providers && Array.isArray(data.providers)) return data.providers.map(x => x.id || x.name || x.key).filter(Boolean);
    return Object.keys(data || {});
  };

  const populateSelect = (id, options, placeholder) => {
    const sel = $(id);
    if (!sel) return;
    const optionsHtml = options.sort().map(opt => `<option value="${opt}">${opt}</option>`).join('');
    sel.innerHTML = `<option value="">${placeholder}</option>${optionsHtml}`;
  };

  async function loadProviders() {
    try {
      const data = await fetchFirstOk([`${API_BASE}/providers.json`, `${API_BASE}/newapi/vendors.json`]);
      const list = extractProviderList(data);
      populateSelect('providerSelect', list, t('providersSelect'));
    } catch (e) { console.error('loadProviders failed', e); }
  }

  const extractModelList = (data, providerId) => {
    if (Array.isArray(data?.models)) {
      return data.models.map(m => typeof m === 'string' ? m : (m?.id || m?.modelId)).filter(Boolean);
    }
    if (data?.models && typeof data.models === 'object') {
      return Object.keys(data.models);
    }
    return [];
  };

  async function loadModels(providerId) {
    try {
      if (!providerId) {
        populateSelect('modelSelect', [], t('modelsSelect'));
        return;
      }

      const encProv = encodeURIComponent(providerId);
      let data = await fetchFirstOk([
        `${API_BASE}/providers/${encProv}.json`,
        `${API_BASE}/i18n/${lang}/providers/${encProv}.json`
      ]);

      let models = extractModelList(data, providerId);

      if (!models.length) {
        const all = await fetchNewApiModels();
        if (Array.isArray(all)) {
          models = all
            .filter(x => (x.providerId || x.provider || x.vendor) === providerId)
            .map(x => x.id || x.modelId)
            .filter(Boolean);
        }
      }

      populateSelect('modelSelect', models, t('modelsSelect'));
    } catch (e) { console.error('loadModels failed', e); }
  }

  // Form field setters
  const setNumber = (id, val) => {
    if (val === undefined || val === null || isNaN(Number(val))) return;
    setValue(id, String(val));
  };
  const setChips = (className, values) => {
    if (!values || (Array.isArray(values) && values.length === 0)) return;
    const set = new Set((Array.isArray(values) ? values : [values]).map(v => String(v).toLowerCase()));
    $$(`.${className}`).forEach(el => { el.checked = set.has(String(el.value).toLowerCase()); });
  };
  const pick = (obj, keys) => {
    for (const k of keys) {
      const parts = k.split('.');
      let cur = obj, ok = true;
      for (const p of parts) {
        if (cur && Object.prototype.hasOwnProperty.call(cur, p)) cur = cur[p];
        else { ok = false; break; }
      }
      if (ok && cur !== undefined && cur !== null) return cur;
    }
    return undefined;
  };

  // Optimized: Universal URL builder to eliminate code duplication
  const buildApiUrls = (providerId, variants, pathTemplates) => {
    const encProv = encodeURIComponent(providerId);
    const urls = [];
    for (const v of variants) {
      const enc = encodeURIComponent(v);
      for (const template of pathTemplates) {
        urls.push(template.replace('{provider}', encProv).replace('{model}', enc));
      }
    }
    return urls;
  };

  // Specific URL builders using the universal function
  const buildModelUrls = (providerId, variants) => buildApiUrls(providerId, variants, [
    `${API_BASE}/models/{provider}/{model}.json`,
    `${API_BASE}/i18n/${lang}/models/{provider}/{model}.json`
  ]);

  const buildI18nModelUrls = (providerId, variants, locale) => buildApiUrls(providerId, variants, [
    `${API_BASE}/i18n/${locale}/models/{provider}/{model}.json`
  ]);

  // Optimized: Centralized NewAPI data fetching
  const fetchNewApiModels = async () => {
    return await fetchFirstOk([
      `${API_BASE}/newapi/models.json`,
      `${API_BASE}/i18n/${lang}/newapi/models.json`
    ]).catch(() => []);
  };

  // Optimized: Encapsulated i18n field setter
  const setI18nFields = (locale, data) => {
    setValue(`i18n-name-${locale}`, pick(data, ['name', 'displayName', 'title']));
    setValue(`i18n-desc-${locale}`, pick(data, ['description', 'desc', 'summary']));
  };

  // Field default states configuration - the most scientific approach
  const FIELD_DEFAULTS = {
    values: {
      // Text/number/date inputs default to empty
      'i18n-name-en': '', 'i18n-name-zh': '', 'i18n-name-ja': '',
      'i18n-desc-en': '', 'i18n-desc-zh': '', 'i18n-desc-ja': '',
      'knowledge': '', 'release-date': '', 'last-updated': '',
      'limit-context': '', 'limit-output': '',
      'cost-input': '', 'cost-output': '', 'cost-cache-read': '', 'cost-cache-write': ''
    },
    checkboxes: {
      // Capabilities default to false
      'cap-reasoning': false, 'cap-tools': false, 'cap-files': false,
      'cap-temp': false, 'cap-open-weights': false,
      // Modalities default to text only
      'in-text': true, 'in-image': false, 'in-audio': false, 'in-video': false, 'in-pdf': false,
      'out-text': true, 'out-image': false, 'out-audio': false, 'out-video': false, 'out-pdf': false
    }
  };

  // Clear all form fields to prevent data residue when switching models
  const clearAllFields = () => {
    // Restore all fields to their default states
    Object.entries(FIELD_DEFAULTS.values).forEach(([id, defaultValue]) => {
      const el = $(id);
      if (el) el.value = defaultValue;
    });

    Object.entries(FIELD_DEFAULTS.checkboxes).forEach(([id, defaultChecked]) => {
      const el = $(id);
      if (el) el.checked = defaultChecked;
    });
  };

  const findModelInAll = async (providerId, variants) => {
    const all = await fetchNewApiModels();

    if (Array.isArray(all)) {
      const normVariants = new Set(variants.map(normalizeId));
      return all.find(x =>
        (x.providerId || x.provider || x.vendor) === providerId &&
        (normVariants.has(normalizeId(x.id)) || normVariants.has(normalizeId(x.modelId)))
      ) || {};
    }
    return {};
  };

  async function loadModelDetail(providerId, modelId) {
    try {
      if (!providerId || !modelId) return;

      // Clear all fields first to prevent data residue from previous model
      clearAllFields();

      const variants = modelIdVariants(modelId);
      const candidateUrls = buildModelUrls(providerId, variants);

      const data = await fetchFirstOk(candidateUrls)
        .catch(() => findModelInAll(providerId, variants));

      // Set basic info - prefill i18n fields from main data
      setI18nFields('en', data);

      // Prefill i18n for en/zh/ja in parallel
      const locales = ['en', 'zh', 'ja'];
      await Promise.all(locales.map(async (lc) => {
        try {
          const ld = await fetchFirstOk(buildI18nModelUrls(providerId, variants, lc));
          setI18nFields(lc, ld);
        } catch (_) { }
      }));
      setValue('knowledge', pick(data, ['knowledge', 'knowledge_cutoff', 'knowledgeCutoff']));
      setValue('release-date', pick(data, ['release_date', 'releaseDate', 'released']));
      setValue('last-updated', pick(data, ['last_updated', 'lastUpdated', 'updated_at', 'updatedAt']));

      // Set modalities
      setChips('mod-in', pick(data, ['modalities.input', 'input_modalities', 'input']));
      setChips('mod-out', pick(data, ['modalities.output', 'output_modalities', 'output']));

      // Set limits
      setNumber('limit-context', pick(data, ['limit.context', 'context_window', 'contextWindow', 'context', 'contextTokens']));
      setNumber('limit-output', pick(data, ['limit.output', 'max_output_tokens', 'maxOutput', 'max_output', 'outputTokens']));

      // Set pricing
      setNumber('cost-input', pick(data, ['cost.input', 'pricing.input', 'pricing.prompt', 'price.input', 'price_input', 'input_price']));
      setNumber('cost-output', pick(data, ['cost.output', 'pricing.output', 'pricing.completion', 'price.output', 'price_output', 'output_price']));
      setNumber('cost-cache-read', pick(data, ['cost.cache_read', 'pricing.cache_read', 'price.cache_read', 'cache_read_price']));
      setNumber('cost-cache-write', pick(data, ['cost.cache_write', 'pricing.cache_write', 'price.cache_write', 'cache_write_price']));

      // Set capabilities
      const capabilities = [
        ['cap-reasoning', ['reasoning', 'features.reasoning', 'capabilities.reasoning', 'supportsReasoning']],
        ['cap-tools', ['tool_call', 'tools', 'toolCalling', 'capabilities.tools', 'features.tools']],
        ['cap-files', ['attachment', 'file', 'files', 'capabilities.files', 'features.files']],
        ['cap-temp', ['temperature', 'features.temperature', 'capabilities.temperature']],
        ['cap-open-weights', ['open_weights', 'openWeights']]
      ];

      capabilities.forEach(([id, keys]) => {
        const el = $(id);
        if (el) el.checked = !!pick(data, keys);
      });

      setStatus(t('loadedModel'));
    } catch (e) { console.error('loadModelDetail failed', e); }
  }

  const toggleVisibility = (id, isHidden) => {
    const el = $(id);
    if (el) el.classList.toggle('is-hidden', isHidden);
  };

  function setMode(mode) {
    const isUpdate = mode === 'update';

    // Show provider dropdown, hide input
    toggleVisibility('providerId', true);
    toggleVisibility('providerSelect', false);
    loadProviders();

    // Toggle model input/select based on mode
    toggleVisibility('id', isUpdate);
    toggleVisibility('modelSelect', !isUpdate);

    if (!isUpdate) {
      const modelSelect = $('modelSelect');
      if (modelSelect) modelSelect.innerHTML = '';
    }
  }

  function toggleMode() {
    const isBatch = getMode() === 'batch';

    // Toggle all single mode sections
    const singleSections = [
      'single-mode', 'single-fields', 'single-capabilities',
      'single-i18n', 'single-metadata', 'single-modalities', 'single-limits', 'single-pricing'
    ];

    singleSections.forEach(id => toggleVisibility(id, isBatch));
    toggleVisibility('batch-mode', !isBatch);

    if (isBatch) updateBatchPreview();
    else setOpenIssueEnabled(true);
  }

  function updateBatchPreview() {
    const { valid, models, error } = parseAndValidateBatch();

    setText('batch-count', String(models.length || 0));

    if (!valid) {
      setOpenIssueEnabled(false);
      setStatus(error, true);

      const previewContent = error === t('batchCannotBeEmpty')
        ? `<div style="color: #9ca3af;">${t('noData')}</div>`
        : `<div style="color: #ef4444;">${error}</div>`;

      setHTML('batch-list', previewContent);
      return;
    }

    setOpenIssueEnabled(true);
    setStatus('');

    const items = models.map((m, i) => {
      const prov = m.providerId || '';
      const model = m.id || m.modelId || '';
      const action = m.action || t('create');
      const name = m.i18n?.name?.en || '';
      return `<div style="margin-bottom: 4px;"><strong>${i + 1}.</strong> ${action} <code>${prov}/${model}</code> ${name ? `(${name})` : ''}</div>`;
    }).join('');

    setHTML('batch-list', items || `<div style="color: #9ca3af;">${t('noData')}</div>`);
  }

  // Issue generation helpers
  const buildBatchTitle = (count, providerList) =>
    `[${t('batchSubmission')}] ${count} ${t('modelsCount')} (${providerList})`;

  const buildSingleTitle = (single) => {
    const actionModel = single.action === 'update' ? t('updateModel') : t('createModel');
    return `[${actionModel}] ${single.providerId ?? ''}/${single.id ?? ''}`;
  };

  const buildProviderList = (providers) => {
    return providers.length > 3
      ? `${providers.slice(0, 3).join(', ')} ${t('moreProviders')} ${providers.length} ${t('providers')}`
      : providers.join(', ');
  };

  const buildModelListForBatch = (models) => {
    return models.map((m, i) => {
      const prov = m.providerId || '';
      const model = m.id || m.modelId || '';
      const action = m.action === 'update' ? t('update') : t('create');
      const name = m.i18n?.name?.[lang] || m.i18n?.name?.en ? ` - ${m.i18n.name[lang] || m.i18n.name.en}` : '';
      return `${i + 1}. **${action}** \`${prov}/${model}\`${name}`;
    }).join('\n');
  };

  const buildIssueBody = (sections) => sections.filter(Boolean).join('\n');

  function buildIssue() {
    const p = buildPayload();
    const mode = getMode();
    let title, body;

    if (mode === 'batch' && Array.isArray(p)) {
      const count = p.length;
      const providers = [...new Set(p.map(m => m.providerId).filter(Boolean))];
      const providerList = buildProviderList(providers);

      title = buildBatchTitle(count, providerList);
      body = buildIssueBody([
        `🚀 **${t('batchSubmissionRequest')}**`,
        '',
        t('issueIntroBatch'),
        '',
        `## 📋 ${t('submissionSummary')}`,
        `- **${t('totalCount')}**: ${count} ${t('modelsCount')}`,
        `- **${t('providers')}**: ${providerList}`,
        `- **${t('mode')}**: ${t('batchProcessing')}`,
        '',
        `## 📝 ${t('modelDetails')}`,
        buildModelListForBatch(p),
        '',
        `## 🔧 ${t('techInfo')}`,
        '<details>',
        '<summary>Complete JSON Data</summary>',
        '',
        '```json',
        JSON.stringify(p, null, 2).replace(/\r\n/g, '\n'),
        '```',
        '',
        '</details>',
        '',
        '---',
        `*${t('issueFooterBatch')}*`,
      ]);
    } else {
      const single = Array.isArray(p) ? p[0] || {} : p;
      const action = single.action === 'update' ? t('update') : t('create');
      const actionIcon = single.action === 'update' ? '✏️' : '➕';
      const requestType = single.action === 'update' ? t('updateModelRequest') : t('createModelRequest');

      title = buildSingleTitle(single);
      body = buildIssueBody([
        `${actionIcon} **${requestType}**`,
        '',
        t('issueIntroSingle'),
        '',
        `## 📋 ${t('modelInfo')}`,
        `- **${t('provider')}**: \`${single.providerId ?? ''}\``,
        `- **${t('modelId')}**: \`${single.id ?? ''}\``,
        single.i18n?.name?.en ? `- **${t('displayName')}**: ${single.i18n.name.en}` : '',
        single.i18n?.description?.en ? `- **${t('description')}**: ${single.i18n.description.en}` : '',
        `- **${t('actionType')}**: ${action}`,
        '',
        `## 🔧 ${t('techInfo')}`,
        '<details>',
        '<summary>Complete Configuration Data</summary>',
        '',
        '```json',
        JSON.stringify(single, null, 2).replace(/\r\n/g, '\n'),
        '```',
        '',
        '</details>',
        '',
        '---',
        `*${t('issueFooterSingle')}*`,
      ]);
    }
    return { title, body };
  }

  const createGitHubUrl = (title, body) => {
    const url = new URL(`https://github.com/${repo}/issues/new`);
    // Ensure consistent line endings for better URL encoding
    const normalizedBody = body.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const params = new URLSearchParams({ title, body: normalizedBody, labels: 'model-submission' });
    url.search = params.toString();
    return url.toString();
  };

  function openIssue() {
    if (!ensureValidBeforeSubmit()) return;

    const { title, body } = buildIssue();
    const fullUrl = createGitHubUrl(title, body);

    if (fullUrl.length > 7500) {
      navigator.clipboard?.writeText(body);
      setStatus(t('copyHint'));
      const shortUrl = createGitHubUrl(title, '');
      window.open(shortUrl, '_blank');
    } else {
      window.open(fullUrl, '_blank');
    }
  }

  const copyBody = () => {
    if (!ensureValidBeforeSubmit()) return;
    const { body } = buildIssue();
    // Normalize line endings for clipboard consistency
    const normalizedBody = body.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    navigator.clipboard?.writeText(normalizedBody);
    setStatus(t('copied'));
  };

  // Event handlers
  const handleProviderChange = function () {
    const providerId = this.value;
    setValue('providerId', providerId);
    loadModels(providerId);
  };

  const handleModelChange = function () {
    const modelId = this.value || '';
    setValue('id', modelId);
    const providerId = value('providerId') || value('providerSelect');
    loadModelDetail(providerId, modelId);
  };

  const handleActionChange = function () {
    if (this.checked) setMode(this.value);
  };

  const insertBatchTemplate = () => {
    const template = [
      {
        schema: 'model-submission',
        action: 'create',
        providerId: 'examplecorp',
        id: 'novus-1',
        i18n: {
          name: { en: 'Novus 1', zh: 'Novus 1', ja: 'Novus 1' },
          description: { en: 'Fictional example multimodal model.', zh: '虚构示例多模态模型。', ja: '架空のマルチモーダルモデル例。' }
        },
        reasoning: true,
        tool_call: true,
        attachment: true,
        temperature: true,
        knowledge: '2024-07',
        release_date: '2025-01-20',
        last_updated: '2025-08-21',
        open_weights: false,
        modalities: { input: ['text', 'image', 'audio', 'video', 'pdf'], output: ['text', 'image', 'audio', 'video', 'pdf'] },
        limit: { context: 128000, output: 4096 },
        cost: { input: 5, output: 15, cache_read: 0.075, cache_write: 0.5 }
      },
      {
        schema: 'model-submission',
        action: 'update',
        providerId: 'deepseek',
        id: 'deepseek-chat',
        i18n: {
          name: { en: 'DeepSeek Chat', zh: 'DeepSeek Chat', ja: 'DeepSeek Chat' },
          description: { en: 'Advanced conversational AI model for natural language processing.', zh: '用于自然语言处理的先进对话AI模型。', ja: '自然言語処理のための高度な対話AIモデル。' }
        },
        modalities: { input: ['text'], output: ['text'] }
      }
    ];
    setValue('batch-json', JSON.stringify(template, null, 2).replace(/\r\n/g, '\n'));
    updateBatchPreview();
  };

  // Event binding
  const bindEvents = () => {
    const events = [
      ['providerSelect', 'change', handleProviderChange],
      ['modelSelect', 'change', handleModelChange],
      ['mode-single', 'change', toggleMode],
      ['mode-batch', 'change', toggleMode],
      ['batch-json', 'input', updateBatchPreview],
      ['batch-template', 'click', insertBatchTemplate],
      ['action-create', 'change', handleActionChange],
      ['action-update', 'change', handleActionChange],
      ['open-issue', 'click', openIssue],
      ['copy-body', 'click', copyBody]
    ];

    events.forEach(([id, event, handler]) => {
      const el = $(id);
      if (el) el.addEventListener(event, handler);
    });
  };

  // Initialize application
  const init = () => {
    bindEvents();
    toggleMode();
    setMode(getAction());
  };

  // Start the application
  init();
})();
