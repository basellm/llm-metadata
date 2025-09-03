## Submit a model (auto-PR)

Fill the form below and click “Open GitHub Issue”. A pre-filled issue will open
in a new tab. After you submit that issue, a bot will automatically create a PR
adding/updating the model via overrides, and generate API files.

<style>
  .submit-form {
    max-width: 800px;
    margin: 0 auto;
    background: var(--md-default-bg-color, #ffffff);
    border: 1px solid var(--md-default-fg-color--lightest, #e4e4e7);
    border-radius: 8px;
    padding: 24px;
  }
  .form-section {
    margin-bottom: 32px;
  }
  .form-section:last-child {
    margin-bottom: 0;
  }
  .section-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--md-default-fg-color, #09090b);
  }
  .form-grid {
    display: grid;
    gap: 16px;
    grid-template-columns: 1fr;
  }
  @media (min-width: 640px) {
    .form-grid.cols-2 { grid-template-columns: 1fr 1fr; }
    .form-grid.cols-3 { grid-template-columns: 1fr 1fr 1fr; }
  }
  .form-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .form-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--md-default-fg-color, #09090b);
  }
  .form-input, .form-textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--md-default-fg-color--lightest, #e4e4e7);
    border-radius: 6px;
    background: var(--md-default-bg-color, #ffffff);
    font-size: 14px;
    color: var(--md-default-fg-color, #09090b);
    box-sizing: border-box;
  }
  .form-input:focus, .form-textarea:focus {
    outline: none;
    border-color: var(--md-primary-fg-color, #18181b);
    box-shadow: 0 0 0 2px var(--md-primary-fg-color--light, rgba(24, 24, 27, 0.1));
  }
  .form-textarea {
    min-height: 80px;
    resize: vertical;
  }
  .form-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .form-tag {
    position: relative;
  }
  .form-tag input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  .form-tag label {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    border: 1px solid var(--md-default-fg-color--lightest, #e4e4e7);
    border-radius: 6px;
    background: var(--md-default-bg-color, #ffffff);
    font-size: 14px;
    font-weight: 500;
    color: var(--md-default-fg-color--light, #71717a);
    cursor: pointer;
    user-select: none;
  }
  .form-tag input:checked + label {
    background: var(--md-default-fg-color, #18181b);
    color: var(--md-default-bg-color, #ffffff);
    border-color: var(--md-default-fg-color, #18181b);
  }
  .form-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
    margin-top: 32px;
  }
  .form-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 10px 16px;
    border: 1px solid transparent;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
  }
  .form-button.primary {
    background: var(--md-default-fg-color, #18181b);
    color: var(--md-default-bg-color, #ffffff);
  }
  .form-button.secondary {
    background: var(--md-default-bg-color, #ffffff);
    color: var(--md-default-fg-color, #18181b);
    border-color: var(--md-default-fg-color--lightest, #e4e4e7);
  }
  .form-status {
    font-size: 14px;
    color: var(--md-default-fg-color--light, #71717a);
  }
</style>

<div id="model-submit" data-repo="basellm/llm-metadata">
  <form onsubmit="return false" class="submit-form">
    <div class="form-section">
      <h3 class="section-title">Basic Information</h3>
      <div class="form-grid cols-2">
        <div class="form-field">
          <label class="form-label" for="providerId">Provider ID</label>
          <input id="providerId" class="form-input" type="text" required placeholder="e.g. openai" />
        </div>
        <div class="form-field">
          <label class="form-label" for="modelId">Model ID</label>
          <input id="modelId" class="form-input" type="text" required placeholder="e.g. gpt-4o" />
        </div>
      </div>
      <div class="form-grid cols-2">
        <div class="form-field">
          <label class="form-label" for="name">Display Name</label>
          <input id="name" class="form-input" type="text" placeholder="Optional display name" />
        </div>
        <div class="form-field">
          <label class="form-label" for="icon">Icon URL</label>
          <input id="icon" class="form-input" type="url" placeholder="https://..." />
        </div>
      </div>
      <div class="form-field">
        <label class="form-label" for="description">Description</label>
        <textarea id="description" class="form-textarea" placeholder="Short description of the model"></textarea>
      </div>
    </div>

    <div class="form-section">
      <h3 class="section-title">Capabilities</h3>
      <div class="form-tags">
        <div class="form-tag">
          <input id="cap-reasoning" type="checkbox" />
          <label for="cap-reasoning">Reasoning</label>
        </div>
        <div class="form-tag">
          <input id="cap-tools" type="checkbox" />
          <label for="cap-tools">Tool calling</label>
        </div>
        <div class="form-tag">
          <input id="cap-files" type="checkbox" />
          <label for="cap-files">File attachments</label>
        </div>
        <div class="form-tag">
          <input id="cap-temp" type="checkbox" />
          <label for="cap-temp">Temperature control</label>
        </div>
      </div>
    </div>

    <div class="form-section">
      <h3 class="section-title">Modalities</h3>
      <div class="form-grid cols-2">
        <div class="form-field">
          <label class="form-label">Input</label>
          <div class="form-tags">
            <div class="form-tag">
              <input class="mod-in" type="checkbox" id="in-text" value="text" checked />
              <label for="in-text">text</label>
            </div>
            <div class="form-tag">
              <input class="mod-in" type="checkbox" id="in-image" value="image" />
              <label for="in-image">image</label>
            </div>
            <div class="form-tag">
              <input class="mod-in" type="checkbox" id="in-audio" value="audio" />
              <label for="in-audio">audio</label>
            </div>
            <div class="form-tag">
              <input class="mod-in" type="checkbox" id="in-video" value="video" />
              <label for="in-video">video</label>
            </div>
            <div class="form-tag">
              <input class="mod-in" type="checkbox" id="in-pdf" value="pdf" />
              <label for="in-pdf">pdf</label>
            </div>
          </div>
        </div>
        <div class="form-field">
          <label class="form-label">Output</label>
          <div class="form-tags">
            <div class="form-tag">
              <input class="mod-out" type="checkbox" id="out-text" value="text" checked />
              <label for="out-text">text</label>
            </div>
            <div class="form-tag">
              <input class="mod-out" type="checkbox" id="out-image" value="image" />
              <label for="out-image">image</label>
            </div>
            <div class="form-tag">
              <input class="mod-out" type="checkbox" id="out-audio" value="audio" />
              <label for="out-audio">audio</label>
            </div>
            <div class="form-tag">
              <input class="mod-out" type="checkbox" id="out-video" value="video" />
              <label for="out-video">video</label>
            </div>
            <div class="form-tag">
              <input class="mod-out" type="checkbox" id="out-pdf" value="pdf" />
              <label for="out-pdf">pdf</label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="form-section">
      <h3 class="section-title">Limits</h3>
      <div class="form-grid cols-2">
        <div class="form-field">
          <label class="form-label" for="limit-context">Context window (tokens)</label>
          <input id="limit-context" class="form-input" type="number" min="0" placeholder="e.g. 128000" />
        </div>
        <div class="form-field">
          <label class="form-label" for="limit-output">Max output (tokens)</label>
          <input id="limit-output" class="form-input" type="number" min="0" placeholder="e.g. 4096" />
        </div>
      </div>
    </div>

    <div class="form-section">
      <h3 class="section-title">Pricing (USD per 1M tokens)</h3>
      <div class="form-grid cols-3">
        <div class="form-field">
          <label class="form-label" for="cost-input">Input price</label>
          <input id="cost-input" class="form-input" type="number" min="0" step="0.0001" placeholder="e.g. 5" />
        </div>
        <div class="form-field">
          <label class="form-label" for="cost-output">Output price</label>
          <input id="cost-output" class="form-input" type="number" min="0" step="0.0001" placeholder="e.g. 15" />
        </div>
        <div class="form-field">
          <label class="form-label" for="cost-cache">Cache read price</label>
          <input id="cost-cache" class="form-input" type="number" min="0" step="0.0001" placeholder="e.g. 0.3" />
        </div>
      </div>
    </div>

    <div class="form-section">
      <h3 class="section-title">Action</h3>
      <div class="form-tags">
        <div class="form-tag">
          <input type="radio" name="action" id="action-create" value="create" checked />
          <label for="action-create">Create new</label>
        </div>
        <div class="form-tag">
          <input type="radio" name="action" id="action-update" value="update" />
          <label for="action-update">Update existing</label>
        </div>
      </div>
    </div>

    <div class="form-actions">
      <button id="open-issue" type="button" class="form-button primary">Open GitHub Issue</button>
      <button id="copy-body" type="button" class="form-button secondary">Copy issue body</button>
      <span id="status" class="form-status"></span>
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
