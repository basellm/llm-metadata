## Submit a model (auto-PR)

Fill the form below and click “Open GitHub Issue”. A pre-filled issue will open
in a new tab. After you submit that issue, a bot will automatically create a PR
adding/updating the model via overrides, and generate API files.

<div id="model-submit" data-repo="basellm/llm-metadata">
  <form onsubmit="return false" style="max-width: 880px">
    <h3>Basic</h3>
    <div class="grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <label>
        Provider ID
        <input id="providerId" type="text" required placeholder="e.g. openai" />
      </label>
      <label>
        Model ID
        <input id="modelId" type="text" required placeholder="e.g. gpt-4o" />
      </label>
    </div>
    <div class="grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <label>
        Name
        <input id="name" type="text" placeholder="Optional display name" />
      </label>
      <label>
        Icon URL
        <input id="icon" type="url" placeholder="https://..." />
      </label>
    </div>
    <label>
      Description
      <textarea id="description" rows="4" placeholder="Short description"></textarea>
    </label>

    <h3>Capabilities</h3>
    <div style="display:flex;gap:16px;flex-wrap:wrap;">
      <label><input id="cap-reasoning" type="checkbox" /> Reasoning</label>
      <label><input id="cap-tools" type="checkbox" /> Tool calling</label>
      <label><input id="cap-files" type="checkbox" /> File attachments</label>
      <label><input id="cap-temp" type="checkbox" /> Temperature control</label>
    </div>

    <h3>Modalities</h3>
    <div class="grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div>
        <div>Input</div>
        <label><input class="mod-in" type="checkbox" value="text" checked /> text</label>
        <label><input class="mod-in" type="checkbox" value="image" /> image</label>
        <label><input class="mod-in" type="checkbox" value="audio" /> audio</label>
      </div>
      <div>
        <div>Output</div>
        <label><input class="mod-out" type="checkbox" value="text" checked /> text</label>
        <label><input class="mod-out" type="checkbox" value="image" /> image</label>
        <label><input class="mod-out" type="checkbox" value="audio" /> audio</label>
      </div>
    </div>

    <h3>Limits</h3>
    <div class="grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <label>
        Context window (tokens)
        <input id="limit-context" type="number" min="0" placeholder="e.g. 128000" />
      </label>
      <label>
        Max output (tokens)
        <input id="limit-output" type="number" min="0" placeholder="e.g. 4096" />
      </label>
    </div>

    <h3>Pricing (USD per 1M tokens)</h3>
    <div class="grid" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
      <label>
        Input price
        <input id="cost-input" type="number" min="0" step="0.0001" placeholder="e.g. 5" />
      </label>
      <label>
        Output price
        <input id="cost-output" type="number" min="0" step="0.0001" placeholder="e.g. 15" />
      </label>
      <label>
        Cache read price
        <input id="cost-cache" type="number" min="0" step="0.0001" placeholder="e.g. 0.3" />
      </label>
    </div>

    <h3>Action</h3>
    <label><input type="radio" name="action" value="create" checked /> Create new</label>
    <label><input type="radio" name="action" value="update" /> Update existing</label>

    <div style="margin-top:16px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
      <button id="open-issue" type="button">Open GitHub Issue</button>
      <button id="copy-body" type="button">Copy issue body</button>
      <span id="status" style="opacity:.8;"></span>
    </div>

  </form>
</div>

<script>
  (function () {
    const root = document.getElementById('model-submit');
    const repo = root.getAttribute('data-repo') || 'basellm/llm-metadata';

    function value(id) { return (document.getElementById(id)?.value || '').trim(); }
    function num(id) { const v = value(id); return v ? Number(v) : undefined; }
    function checked(id) { return !!document.getElementById(id)?.checked; }
    function gather(className) {
      return Array.from(document.querySelectorAll('.' + className))
        .filter(x => x.checked)
        .map(x => x.value);
    }

    function buildPayload() {
      const providerId = value('providerId');
      const modelId = value('modelId');
      const payload = {
        schema: 'model-submission',
        action: (document.querySelector('input[name="action"]:checked')?.value || 'create'),
        providerId, modelId,
        name: value('name') || undefined,
        description: value('description') || undefined,
        tags: (value('description') ? undefined : undefined),
        reasoning: checked('cap-reasoning') || undefined,
        tool_call: checked('cap-tools') || undefined,
        attachment: checked('cap-files') || undefined,
        temperature: checked('cap-temp') || undefined,
        icon: value('icon') || undefined,
        modalities: {
          input: gather('mod-in'),
          output: gather('mod-out'),
        },
        limit: {
          context: num('limit-context'),
          output: num('limit-output'),
        },
        cost: {
          input: num('cost-input'),
          output: num('cost-output'),
          cache_read: num('cost-cache'),
        },
      };
      // prune undefined
      const prune = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        const out = Array.isArray(obj) ? [] : {};
        for (const [k, v] of Object.entries(obj)) {
          if (v === undefined || v === null || (Array.isArray(v) && v.length === 0)) continue;
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

    function buildIssue() {
      const p = buildPayload();
      const title = `[Model Submission] ${p.action === 'update' ? 'Update' : 'Create'}: ${p.providerId}/${p.modelId}`;
      const marker = 'MODEL_SUBMISSION';
      const body = [
        `This issue was generated from the website form. A bot will turn it into a PR.`,
        ``,
        `<details><summary>Payload</summary>`,
        '',
        '```json',
        JSON.stringify(p, null, 2),
        '```',
        '',
        `</details>`,
      ].join('\n');
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
