---
hide:
  - navigation
  - toc
---

## Submit a model (auto-PR)

Fill the form below and click "Open GitHub Issue". A pre-filled issue will open
in a new tab. After you submit that issue, a bot will automatically create a PR
adding/updating the model via overrides, and generate API files.

<style>
  /* 8px design system */
  :root {
    --spacing-1: 8px;   /* base spacing */
    --spacing-2: 16px;  /* small spacing */
    --spacing-3: 24px;  /* medium spacing */
    --spacing-4: 32px;  /* large spacing */
    --radius-sm: 8px;   /* small radius */
    --radius-md: 12px;  /* medium radius */
    --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
    --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
  }

  /* Card container */
  .ui-card {
    background: var(--md-default-bg-color, #fff);
    border: 1px solid var(--md-default-fg-color--lightest, #e5e7eb);
    border-radius: var(--radius-md);
    padding: var(--spacing-4);
    box-shadow: var(--shadow-sm);
    max-width: 896px;
    margin: 0 auto;
  }

  /* Title styles */
  .ui-section {
    margin-bottom: var(--spacing-4);
  }
  .ui-section:last-child {
    margin-bottom: 0;
  }
  .ui-section-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--md-default-fg-color, #1f2937);
    margin: 0 0 var(--spacing-2) 0;
    padding-bottom: var(--spacing-1);
    border-bottom: 1px solid var(--md-default-fg-color--lightest, #f3f4f6);
  }

  /* Grid layout */
  .ui-grid {
    display: grid;
    gap: var(--spacing-2);
  }
  .ui-grid.cols-2 {
    grid-template-columns: 1fr;
  }
  .ui-grid.cols-3 {
    grid-template-columns: 1fr;
  }
  @media (min-width: 640px) {
    .ui-grid.cols-2 {
      grid-template-columns: repeat(2, 1fr);
    }
    .ui-grid.cols-3 {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (min-width: 1024px) {
    .ui-grid.cols-3 {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  /* Form fields */
  .ui-field {
    display: flex;
    flex-direction: column;
  }
  .ui-field.full {
    grid-column: 1 / -1;
  }
  .ui-field label {
    font-size: 14px;
    font-weight: 500;
    color: var(--md-default-fg-color, #374151);
    margin-bottom: var(--spacing-1);
  }

  /* Input styles */
  .ui-input,
  .ui-textarea,
  .ui-select {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid var(--md-default-fg-color--lightest, #d1d5db);
    background: var(--md-default-bg-color, #fff);
    border-radius: var(--radius-sm);
    font: inherit;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  .ui-input:focus,
  .ui-textarea:focus,
  .ui-select:focus {
    outline: none;
    border-color: var(--md-primary-fg-color, #4051b5);
    box-shadow: 0 0 0 3px rgba(64, 81, 181, 0.1);
  }
  .ui-textarea {
    min-height: 96px;
    resize: vertical;
    font-family: inherit;
  }
  .is-hidden { display: none !important; }

  /* Chip components */
  .ui-chips {
    display: grid;
    gap: var(--spacing-1);
    grid-template-columns: repeat(auto-fit, minmax(80px, max-content));
  }
  .ui-chips input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  .ui-chips label {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-1) 12px;
    border: 1px solid var(--md-default-fg-color--lightest, #d1d5db);
    background: var(--md-default-bg-color, #fff);
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    user-select: none;
    transition: all 0.2s ease;
    text-align: center;
  }
  .ui-chips label:hover {
    border-color: var(--md-primary-fg-color, #4051b5);
    background: var(--md-code-bg-color, #f8fafc);
  }
  .ui-chips input:checked + label {
    background: var(--md-primary-fg-color, #4051b5);
    color: #fff;
    border-color: var(--md-primary-fg-color, #4051b5);
  }

  /* Segmented control */
  .ui-segment {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    border: 1px solid var(--md-default-fg-color--lightest, #d1d5db);
    border-radius: var(--radius-sm);
    overflow: hidden;
    background: var(--md-code-bg-color, #f8fafc);
  }
  .ui-segment input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  .ui-segment label {
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    border-right: 1px solid var(--md-default-fg-color--lightest, #d1d5db);
  }
  .ui-segment label:last-child {
    border-right: none;
  }
  .ui-segment input:checked + label {
    background: var(--md-primary-fg-color, #4051b5);
    color: #fff;
  }

  /* Button group */
  .ui-actions {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: max-content;
    gap: 12px;
    align-items: center;
    padding-top: var(--spacing-3);
    border-top: 1px solid var(--md-default-fg-color--lightest, #f3f4f6);
  }
  .ui-btn {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 12px 20px;
    border: 1px solid var(--md-default-fg-color--lightest, #d1d5db);
    background: var(--md-default-bg-color, #fff);
    color: var(--md-default-fg-color, #374151);
    border-radius: var(--radius-sm);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
  }
  .ui-btn:hover {
    background: var(--md-code-bg-color, #f8fafc);
    border-color: var(--md-primary-fg-color, #4051b5);
  }
  .ui-btn.primary {
    background: var(--md-primary-fg-color, #4051b5);
    color: #fff;
    border-color: var(--md-primary-fg-color, #4051b5);
  }
  .ui-btn.primary:hover {
    background: var(--md-primary-fg-color, #3648a0);
  }
  .ui-muted {
    font-size: 13px;
    color: var(--md-default-fg-color--light, #6b7280);
  }
</style>

<div id="model-submit" data-repo="basellm/llm-metadata">
  <form onsubmit="return false" class="ui-card">
    <div class="ui-section">
      <h3 class="ui-section-title">Mode</h3>
      <div class="ui-segment" role="group" aria-label="Mode">
        <input type="radio" name="mode" id="mode-single" value="single" checked />
        <label for="mode-single">Single Model</label>
        <input type="radio" name="mode" id="mode-batch" value="batch" />
        <label for="mode-batch">Batch Models</label>
      </div>
    </div>

    <div id="single-mode" class="ui-section">
      <h3 class="ui-section-title">Action</h3>
      <div class="ui-segment" role="group" aria-label="Action">
        <input type="radio" name="action" id="action-create" value="create" checked />
        <label for="action-create">Create</label>
        <input type="radio" name="action" id="action-update" value="update" />
        <label for="action-update">Update</label>
      </div>
    </div>

    <div id="batch-mode" class="ui-section is-hidden">
      <h3 class="ui-section-title">Batch Models JSON</h3>
      <div class="ui-field" style="margin-bottom: var(--spacing-3);">
        <label for="batch-json">Model Array (JSON format)</label>
        <button id="batch-template" type="button" class="ui-btn" style="margin: 0 0 var(--spacing-1) 0; width: max-content;">Fill template</button>
        <textarea id="batch-json" class="ui-textarea" rows="12" placeholder='[
  {
    "schema": "model-submission",
    "action": "create",
    "providerId": "deepseek",
    "modelId": "deepseek-chat",
    "name": "DeepSeek Chat",
    "modalities": { "input": ["text"], "output": ["text"] }
  },
  {
    "schema": "model-submission", 
    "action": "create",
    "providerId": "examplecorp",
    "modelId": "novus-1",
    "name": "Novus 1"
  }
]'></textarea>
      </div>
      <div id="batch-preview" class="ui-field">
        <label>Preview (will submit <span id="batch-count">0</span> models)</label>
        <div id="batch-list" class="ui-muted" style="font-size: 12px; max-height: 200px; overflow-y: auto; border: 1px solid var(--md-default-fg-color--lightest); border-radius: var(--radius-sm); padding: var(--spacing-2);"></div>
      </div>
    </div>

    <div id="single-fields" class="ui-section">
      <h3 class="ui-section-title">Basic Information</h3>
      <div class="ui-grid cols-3">
        <div class="ui-field">
          <label for="providerId">Provider ID</label>
          <input id="providerId" class="ui-input" type="text" required placeholder="e.g. openai" />
          <select id="providerSelect" class="ui-select is-hidden"></select>
        </div>
        <div class="ui-field">
          <label for="modelId">Model ID</label>
          <input id="modelId" class="ui-input" type="text" required placeholder="e.g. gpt-4o" />
          <select id="modelSelect" class="ui-select is-hidden"></select>
        </div>
        <div class="ui-field">
          <label for="name">Display Name</label>
          <input id="name" class="ui-input" type="text" placeholder="Optional display name" />
        </div>
        <div class="ui-field">
          <label for="icon">LobeIcon string <a href="https://icons.lobehub.com/components/lobe-hub" target="_blank" class="ui-muted">catalog</a></label>
          <input id="icon" class="ui-input" type="text" placeholder="e.g. AzureAI.Color" />
        </div>
        <div class="ui-field">
          <label for="iconURL">Icon URL</label>
          <input id="iconURL" class="ui-input" type="url" placeholder="https://..." />
        </div>
        <div class="ui-field full">
          <label for="description">Description</label>
          <textarea id="description" class="ui-textarea" placeholder="Brief description of the model"></textarea>
        </div>
      </div>
    </div>

    <div id="single-capabilities" class="ui-section">
      <h3 class="ui-section-title">Capabilities</h3>
      <div class="ui-chips">
        <input id="cap-reasoning" type="checkbox" />
        <label for="cap-reasoning">Reasoning</label>
        <input id="cap-tools" type="checkbox" />
        <label for="cap-tools">Tool calling</label>
        <input id="cap-files" type="checkbox" />
        <label for="cap-files">File attachments</label>
        <input id="cap-temp" type="checkbox" />
        <label for="cap-temp">Temperature control</label>
      </div>
    </div>

    <div id="single-modalities" class="ui-section">
      <h3 class="ui-section-title">Modalities</h3>
      <div class="ui-grid cols-2">
        <div class="ui-field">
          <label>Input</label>
          <div class="ui-chips">
            <input class="mod-in" type="checkbox" id="in-text" value="text" checked />
            <label for="in-text">text</label>
            <input class="mod-in" type="checkbox" id="in-image" value="image" />
            <label for="in-image">image</label>
            <input class="mod-in" type="checkbox" id="in-audio" value="audio" />
            <label for="in-audio">audio</label>
            <input class="mod-in" type="checkbox" id="in-video" value="video" />
            <label for="in-video">video</label>
            <input class="mod-in" type="checkbox" id="in-pdf" value="pdf" />
            <label for="in-pdf">pdf</label>
          </div>
        </div>
        <div class="ui-field">
          <label>Output</label>
          <div class="ui-chips">
            <input class="mod-out" type="checkbox" id="out-text" value="text" checked />
            <label for="out-text">text</label>
            <input class="mod-out" type="checkbox" id="out-image" value="image" />
            <label for="out-image">image</label>
            <input class="mod-out" type="checkbox" id="out-audio" value="audio" />
            <label for="out-audio">audio</label>
            <input class="mod-out" type="checkbox" id="out-video" value="video" />
            <label for="out-video">video</label>
            <input class="mod-out" type="checkbox" id="out-pdf" value="pdf" />
            <label for="out-pdf">pdf</label>
          </div>
        </div>
      </div>
    </div>

    <div id="single-limits" class="ui-section">
      <h3 class="ui-section-title">Limits</h3>
      <div class="ui-grid cols-2">
        <div class="ui-field">
          <label for="limit-context">Context window (tokens)</label>
          <input id="limit-context" class="ui-input" type="number" min="0" placeholder="e.g. 128000" />
        </div>
        <div class="ui-field">
          <label for="limit-output">Max output (tokens)</label>
          <input id="limit-output" class="ui-input" type="number" min="0" placeholder="e.g. 4096" />
        </div>
      </div>
    </div>

    <div id="single-pricing" class="ui-section">
      <h3 class="ui-section-title">Pricing (USD per 1M tokens)</h3>
      <div class="ui-grid cols-3">
        <div class="ui-field">
          <label for="cost-input">Input price</label>
          <input id="cost-input" class="ui-input" type="number" min="0" step="0.0001" placeholder="e.g. 5" />
        </div>
        <div class="ui-field">
          <label for="cost-output">Output price</label>
          <input id="cost-output" class="ui-input" type="number" min="0" step="0.0001" placeholder="e.g. 15" />
        </div>
        <div class="ui-field">
          <label for="cost-cache">Cache read price</label>
          <input id="cost-cache" class="ui-input" type="number" min="0" step="0.0001" placeholder="e.g. 0.3" />
        </div>
      </div>
    </div>

    <div class="ui-actions">
      <button id="open-issue" type="button" class="ui-btn primary">Open GitHub Issue</button>
      <button id="copy-body" type="button" class="ui-btn">Copy issue body</button>
      <span id="status" class="ui-muted"></span>
    </div>
  </form>
</div>

<script>
  (function () {
    const root = document.getElementById('model-submit');
    const repo = root.getAttribute('data-repo') || 'basellm/llm-metadata';
    const API_BASE = (root.getAttribute('data-api') || 'https://basellm.github.io/llm-metadata/api').replace(/\/$/, '');

    function value(id) { return (document.getElementById(id)?.value || '').trim(); }
    function num(id) { const v = value(id); return v ? Number(v) : undefined; }
    function checked(id) { return !!document.getElementById(id)?.checked; }
    function gather(className) {
      return Array.from(document.querySelectorAll('.' + className))
        .filter(x => x.checked)
        .map(x => x.value);
    }

    function buildPayload() {
      const mode = document.querySelector('input[name="mode"]:checked')?.value || 'single';
      
      if (mode === 'batch') {
        try {
          const batchText = value('batch-json');
          if (!batchText) return [];
          const parsed = JSON.parse(batchText);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          console.error('Batch JSON parse error:', e);
          return [];
        }
      }
      
      const providerId = value('providerId') || undefined;
      const modelId = value('modelId') || undefined;
      const payload = {
        schema: 'model-submission',
        action: (document.querySelector('input[name="action"]:checked')?.value || 'create'),
        providerId, modelId,
        name: value('name') || undefined,
        description: value('description') || undefined,
        reasoning: checked('cap-reasoning') || undefined,
        tool_call: checked('cap-tools') || undefined,
        attachment: checked('cap-files') || undefined,
        temperature: checked('cap-temp') || undefined,
        icon: value('icon') || undefined,
        iconURL: value('iconURL') || undefined,
        modalities: { input: gather('mod-in'), output: gather('mod-out') },
        limit: { context: num('limit-context'), output: num('limit-output') },
        cost: { input: num('cost-input'), output: num('cost-output'), cache_read: num('cost-cache') },
      };
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
          } else {
            out[k] = v;
          }
        }
        return out;
      };
      return prune(payload);
    }

    async function fetchJSON(url) {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    }

    async function fetchFirstOk(urls) {
      for (const url of urls) {
        try { return await fetchJSON(url); } catch (_) {}
      }
      throw new Error('All fetch candidates failed');
    }

    function modelIdVariants(modelId) {
      const v = String(modelId || '');
      const underscore = v.replace(/:/g, '_');
      return Array.from(new Set([underscore, v].filter(Boolean)));
    }
    function normalizeId(id) {
      return String(id || '').replace(/:/g, '_');
    }

    async function loadProviders() {
      try {
        const data = await fetchJSON(`${API_BASE}/providers.json`).catch(() => fetchJSON(`${API_BASE}/newapi/vendors.json`));
        let list = [];
        if (Array.isArray(data)) list = data.map(x => x.id || x.name || x.providerId || x.key).filter(Boolean);
        else if (data && Array.isArray(data.providers)) list = data.providers.map(x => x.id || x.name || x.key).filter(Boolean);
        else list = Object.keys(data || {});
        const sel = document.getElementById('providerSelect');
        sel.innerHTML = '<option value="">Select provider…</option>' + (list || []).sort().map(p => `<option value="${p}">${p}</option>`).join('');
      } catch (e) {
        console.error('loadProviders failed', e);
      }
    }

    async function loadModels(providerId) {
      try {
        if (!providerId) { document.getElementById('modelSelect').innerHTML = '<option value="">Select model…</option>'; return; }
        let data = await fetchJSON(`${API_BASE}/providers/${encodeURIComponent(providerId)}.json`)
          .catch(() => fetchJSON(`${API_BASE}/i18n/en/providers/${encodeURIComponent(providerId)}.json`));
        let models = [];
        if (Array.isArray(data?.models)) models = data.models.map(m => (typeof m === 'string' ? m : (m?.id || m?.modelId))).filter(Boolean);
        else if (data?.models && typeof data.models === 'object') models = Object.keys(data.models);
        if (!models.length) {
          const all = await fetchJSON(`${API_BASE}/newapi/models.json`).catch(() => fetchJSON(`${API_BASE}/i18n/en/newapi/models.json`));
          if (Array.isArray(all)) models = all.filter(x => (x.providerId || x.provider || x.vendor) === providerId).map(x => x.id || x.modelId).filter(Boolean);
        }
        const sel = document.getElementById('modelSelect');
        sel.innerHTML = '<option value="">Select model…</option>' + (models || []).filter(Boolean).sort().map(m => `<option value="${m}">${m}</option>`).join('');
      } catch (e) {
        console.error('loadModels failed', e);
      }
    }

    function setValue(id, val) {
      const el = document.getElementById(id);
      if (!el) return;
      if (val === undefined || val === null) return;
      const s = typeof val === 'string' ? val : String(val);
      if (s.trim() === '') return;
      el.value = s;
    }
    function setNumber(id, val) {
      if (val === undefined || val === null || isNaN(Number(val))) return;
      const el = document.getElementById(id);
      if (el) el.value = String(val);
    }
    function setChips(className, values) {
      if (!values || (Array.isArray(values) && values.length === 0)) return;
      const set = new Set((Array.isArray(values) ? values : [values]).map(v => String(v).toLowerCase()));
      Array.from(document.querySelectorAll('.' + className)).forEach((el) => {
        el.checked = set.has(String(el.value).toLowerCase());
      });
    }
    function pick(obj, keys) {
      for (const k of keys) {
        const parts = k.split('.');
        let cur = obj;
        let ok = true;
        for (const p of parts) {
          if (cur && Object.prototype.hasOwnProperty.call(cur, p)) cur = cur[p]; else { ok = false; break; }
        }
        if (ok && cur !== undefined && cur !== null) return cur;
      }
      return undefined;
    }
    async function loadModelDetail(providerId, modelId) {
      try {
        if (!providerId || !modelId) return;
        const variants = modelIdVariants(modelId);
        const encProv = encodeURIComponent(providerId);
        const candidateUrls = [];
        for (const v of variants) {
          const enc = encodeURIComponent(v);
          candidateUrls.push(
            `${API_BASE}/models/${encProv}/${enc}.json`,
            `${API_BASE}/i18n/en/models/${encProv}/${enc}.json`
          );
        }
        let data = await fetchFirstOk(candidateUrls).catch(async () => {
          const all = await fetchFirstOk([
            `${API_BASE}/newapi/models.json`,
            `${API_BASE}/i18n/en/newapi/models.json`,
          ]).catch(() => []);
          if (Array.isArray(all)) {
            const normVariants = new Set(variants.map(normalizeId));
            const found = all.find(x => (x.providerId || x.provider || x.vendor) === providerId && (normVariants.has(normalizeId(x.id)) || normVariants.has(normalizeId(x.modelId))));
            return found || {};
          }
          return {};
        });

        setValue('name', pick(data, ['name', 'displayName', 'title']));
        setValue('description', pick(data, ['description', 'desc', 'summary']));
        setValue('icon', pick(data, ['icon', 'lobeIcon']));
        setValue('iconURL', pick(data, ['iconURL', 'icon_url', 'logo']));

        const inMods = pick(data, ['modalities.input', 'input_modalities', 'input']);
        const outMods = pick(data, ['modalities.output', 'output_modalities', 'output']);
        setChips('mod-in', inMods);
        setChips('mod-out', outMods);

        setNumber('limit-context', pick(data, ['limit.context', 'context_window', 'contextWindow', 'context', 'contextTokens']));
        setNumber('limit-output', pick(data, ['limit.output', 'max_output_tokens', 'maxOutput', 'max_output', 'outputTokens']));

        const costInput = pick(data, ['cost.input', 'pricing.input', 'pricing.prompt', 'price.input', 'price_input', 'input_price']);
        const costOutput = pick(data, ['cost.output', 'pricing.output', 'pricing.completion', 'price.output', 'price_output', 'output_price']);
        const costCache = pick(data, ['cost.cache_read', 'pricing.cache_read', 'price.cache_read', 'cache_read_price']);
        setNumber('cost-input', costInput);
        setNumber('cost-output', costOutput);
        setNumber('cost-cache', costCache);

        const hasReasoning = !!pick(data, ['reasoning', 'features.reasoning', 'capabilities.reasoning', 'supportsReasoning']);
        const hasTools = !!pick(data, ['tool_call', 'tools', 'toolCalling', 'capabilities.tools', 'features.tools']);
        const hasAttach = !!pick(data, ['attachment', 'file', 'files', 'capabilities.files', 'features.files']);
        const hasTemp = !!pick(data, ['temperature', 'features.temperature', 'capabilities.temperature']);
        document.getElementById('cap-reasoning').checked = hasReasoning;
        document.getElementById('cap-tools').checked = hasTools;
        document.getElementById('cap-files').checked = hasAttach;
        document.getElementById('cap-temp').checked = hasTemp;

        const status = document.getElementById('status');
        if (status) status.textContent = 'Loaded current model details.';
      } catch (e) {
        console.error('loadModelDetail failed', e);
      }
    }

    function setMode(mode) {
      const isUpdate = mode === 'update';
      const providerInput = document.getElementById('providerId');
      const providerSelect = document.getElementById('providerSelect');
      const modelInput = document.getElementById('modelId');
      const modelSelect = document.getElementById('modelSelect');

      // Provider: always use dropdown
      providerInput.classList.add('is-hidden');
      providerSelect.classList.remove('is-hidden');
      loadProviders();

      if (isUpdate) {
        modelInput.classList.add('is-hidden');
        modelSelect.classList.remove('is-hidden');
      } else {
        modelInput.classList.remove('is-hidden');
        modelSelect.classList.add('is-hidden');
        modelSelect.innerHTML = '';
      }
    }

    document.getElementById('providerSelect')?.addEventListener('change', function(){
      const providerId = this.value;
      document.getElementById('providerId').value = providerId || '';
      loadModels(providerId);
    });
    document.getElementById('modelSelect')?.addEventListener('change', function(){
      const modelId = this.value || '';
      document.getElementById('modelId').value = modelId;
      const providerId = document.getElementById('providerId').value || document.getElementById('providerSelect').value;
      loadModelDetail(providerId, modelId);
    });

    // Mode switching
    function toggleMode() {
      const mode = document.querySelector('input[name="mode"]:checked')?.value || 'single';
      const isBatch = mode === 'batch';
      
      document.getElementById('single-mode').classList.toggle('is-hidden', isBatch);
      document.getElementById('batch-mode').classList.toggle('is-hidden', !isBatch);
      document.getElementById('single-fields').classList.toggle('is-hidden', isBatch);
      document.getElementById('single-capabilities').classList.toggle('is-hidden', isBatch);
      document.getElementById('single-modalities').classList.toggle('is-hidden', isBatch);
      document.getElementById('single-limits').classList.toggle('is-hidden', isBatch);
      document.getElementById('single-pricing').classList.toggle('is-hidden', isBatch);
      
      if (isBatch) {
        updateBatchPreview();
      }
    }
    
    // Batch preview update
    function updateBatchPreview() {
      try {
        const batchText = value('batch-json');
        const countEl = document.getElementById('batch-count');
        const listEl = document.getElementById('batch-list');
        
        if (!batchText.trim()) {
          countEl.textContent = '0';
          listEl.innerHTML = '<div style="color: #9ca3af;">Please enter JSON array</div>';
          return;
        }
        
        const parsed = JSON.parse(batchText);
        const models = Array.isArray(parsed) ? parsed : [parsed];
        countEl.textContent = String(models.length);
        
        const items = models.map((m, i) => {
          const prov = m.providerId || '?';
          const model = m.modelId || '?';
          const action = m.action || 'create';
          const name = m.name || '';
          return `<div style="margin-bottom: 4px;"><strong>${i+1}.</strong> ${action} <code>${prov}/${model}</code> ${name ? `(${name})` : ''}</div>`;
        }).join('');
        
        listEl.innerHTML = items || '<div style="color: #9ca3af;">No valid models</div>';
      } catch (e) {
        const countEl = document.getElementById('batch-count');
        const listEl = document.getElementById('batch-list');
        countEl.textContent = '0';
        listEl.innerHTML = `<div style="color: #ef4444;">JSON format error: ${e.message}</div>`;
      }
    }
    
    document.getElementById('mode-single')?.addEventListener('change', toggleMode);
    document.getElementById('mode-batch')?.addEventListener('change', toggleMode);
    document.getElementById('batch-json')?.addEventListener('input', updateBatchPreview);
    document.getElementById('batch-template')?.addEventListener('click', function(){
      const template = [
        {
          schema: 'model-submission',
          action: 'create',
          providerId: 'examplecorp',
          modelId: 'novus-1',
          id: 'novus-1',
          name: 'Novus 1',
          description: 'Fictional example multimodal model.',
          tags: ['example', 'fictional', 'demo'],
          icon: 'Novus.Color',
          iconURL: 'https://example.com/novus.png',
          reasoning: true,
          tool_call: true,
          attachment: true,
          temperature: true,
          modalities: { input: ['text', 'image', 'audio', 'video', 'pdf'], output: ['text', 'image', 'audio', 'video', 'pdf'] },
          limit: { context: 128000, output: 4096 },
          cost: { input: 5, output: 15, cache_read: 0.3 }
        },
        {
          schema: 'model-submission',
          action: 'update',
          providerId: 'deepseek',
          modelId: 'deepseek-chat',
          name: 'DeepSeek Chat',
          modalities: { input: ['text'], output: ['text'] }
        }
      ];
      const el = document.getElementById('batch-json');
      if (el) el.value = JSON.stringify(template, null, 2);
      updateBatchPreview();
    });
    
    document.getElementById('action-create')?.addEventListener('change', function(){ if (this.checked) setMode('create'); });
    document.getElementById('action-update')?.addEventListener('change', function(){ if (this.checked) setMode('update'); });
    
    toggleMode();
    setMode(document.querySelector('input[name="action"]:checked')?.value || 'create');

    function buildIssue() {
      const p = buildPayload();
      const mode = document.querySelector('input[name="mode"]:checked')?.value || 'single';
      
      let title, body;
      if (mode === 'batch' && Array.isArray(p)) {
        const count = p.length;
        const providers = [...new Set(p.map(m => m.providerId).filter(Boolean))];
        const providerList = providers.length > 3 ? `${providers.slice(0, 3).join(', ')} & ${providers.length - 3} more` : providers.join(', ');
        
        title = `[Batch Submission] ${count} models (${providerList})`;
        
        const modelList = p.map((m, i) => {
          const prov = m.providerId || 'unknown';
          const model = m.modelId || 'unknown';
          const action = m.action === 'update' ? 'Update' : 'Create';
          const name = m.name ? ` - ${m.name}` : '';
          return `${i + 1}. **${action}** \`${prov}/${model}\`${name}`;
        }).join('\n');
        
        body = [
          `🚀 **Batch Model Submission Request**`,
          ``,
          `This issue was generated from the website form (batch mode). A bot will automatically process and create a PR.`,
          ``,
          `## 📋 Submission Summary`,
          `- **Total Count**: ${count} models`,
          `- **Providers**: ${providerList}`,
          `- **Mode**: Batch Processing`,
          ``,
          `## 📝 Model Details`,
          modelList,
          ``,
          `## 🔧 Technical Information`,
          `<details><summary>Complete JSON Data</summary>`,
          '',
          '```json',
          JSON.stringify(p, null, 2),
          '```',
          '',
          `</details>`,
          ``,
          `---`,
          `*This issue will be automatically processed, creating individual override files for each model*`,
        ].join('\n');
      } else {
        const single = Array.isArray(p) ? p[0] || {} : p;
        const action = single.action === 'update' ? 'Update' : 'Create';
        const actionIcon = single.action === 'update' ? '✏️' : '➕';
        
        title = `[${action} Model] ${single.providerId ?? 'unknown'}/${single.modelId ?? 'unknown'}`;
        
        body = [
          `${actionIcon} **${action} Model Request**`,
          ``,
          `This issue was generated from the website form. A bot will automatically process and create a PR.`,
          ``,
          `## 📋 Model Information`,
          `- **Provider**: \`${single.providerId ?? 'Not specified'}\``,
          `- **Model ID**: \`${single.modelId ?? 'Not specified'}\``,
          single.name ? `- **Display Name**: ${single.name}` : '',
          single.description ? `- **Description**: ${single.description}` : '',
          `- **Action Type**: ${action}`,
          ``,
          `## 🔧 Technical Information`,
          `<details><summary>Complete Configuration Data</summary>`,
          '',
          '```json',
          JSON.stringify(single, null, 2),
          '```',
          '',
          `</details>`,
          ``,
          `---`,
          `*This issue will be automatically processed and generate the corresponding model override file*`,
        ].filter(Boolean).join('\n');
      }
      return { title, body };
    }

    function openIssue() {
      const { title, body } = buildIssue();
      const url = new URL(`https://github.com/${repo}/issues/new`);
      const params = new URLSearchParams({ title, body, labels: 'model-submission' });
      url.search = params.toString();
      const full = url.toString();
      if (full.length > 7500) {
        navigator.clipboard?.writeText(body);
        document.getElementById('status').textContent = 'Body copied to clipboard. Please paste it after the page opens.';
        const u = new URL(`https://github.com/${repo}/issues/new`);
        u.search = new URLSearchParams({ title, labels: 'model-submission' }).toString();
        window.open(u.toString(), '_blank');
      } else {
        window.open(full, '_blank');
      }
    }

    document.getElementById('open-issue').addEventListener('click', openIssue);
    document.getElementById('copy-body').addEventListener('click', function(){
      const { body } = buildIssue();
      navigator.clipboard?.writeText(body);
      document.getElementById('status').textContent = 'Copied to clipboard';
    });
  })();
</script>