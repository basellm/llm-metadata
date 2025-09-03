---
hide:
  - navigation
---

## Submit a model (auto-PR)

Fill the form below and click "Open GitHub Issue". A pre-filled issue will open
in a new tab. After you submit that issue, a bot will automatically create a PR
adding/updating the model via overrides, and generate API files.

<link rel="stylesheet" href="../assets/submit-form.css" />
<script src="../assets/submit-form-i18n.js"></script>

<div id="model-submit" data-repo="basellm/llm-metadata" data-lang="en">
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
    "id": "deepseek-chat",
    "name": "DeepSeek Chat",
    "modalities": { "input": ["text"], "output": ["text"] }
  },
  {
    "schema": "model-submission", 
    "action": "create",
    "providerId": "examplecorp",
    "id": "novus-1",
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
          <label for="providerId" class="required">Provider ID</label>
          <input id="providerId" class="ui-input" type="text" required placeholder="e.g. openai" />
          <select id="providerSelect" class="ui-select is-hidden"></select>
        </div>
        <div class="ui-field">
          <label for="id" class="required">Model ID</label>
          <input id="id" class="ui-input" type="text" required placeholder="e.g. gpt-4o" />
          <select id="modelSelect" class="ui-select is-hidden"></select>
        </div>
        <div class="ui-field">
          <label for="name">Display Name</label>
          <input id="name" class="ui-input" type="text" placeholder="Optional display name" />
        </div>
        <div class="ui-field full">
          <label for="description">Description</label>
          <textarea id="description" class="ui-textarea" placeholder="Brief description of the model"></textarea>
        </div>
      </div>
    </div>

    <div id="single-metadata" class="ui-section">
      <h3 class="ui-section-title">Metadata</h3>
      <div class="ui-grid cols-3">
        <div class="ui-field">
          <label for="knowledge">Knowledge cutoff</label>
          <input id="knowledge" class="ui-input" type="text" placeholder="e.g. 2024-07" />
        </div>
        <div class="ui-field">
          <label for="release-date">Release date</label>
          <input id="release-date" class="ui-input" type="date" />
        </div>
        <div class="ui-field">
          <label for="last-updated">Last updated</label>
          <input id="last-updated" class="ui-input" type="date" />
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
        <input id="cap-open-weights" type="checkbox" />
        <label for="cap-open-weights">Open weights</label>
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
      <div class="ui-grid cols-2">
        <div class="ui-field">
          <label for="cost-input">Input price</label>
          <input id="cost-input" class="ui-input" type="number" min="0" step="0.0001" placeholder="e.g. 5" />
        </div>
        <div class="ui-field">
          <label for="cost-output">Output price</label>
          <input id="cost-output" class="ui-input" type="number" min="0" step="0.0001" placeholder="e.g. 15" />
        </div>
        <div class="ui-field">
          <label for="cost-cache-read">Cache read price</label>
          <input id="cost-cache-read" class="ui-input" type="number" min="0" step="0.0001" placeholder="e.g. 0.075" />
        </div>
        <div class="ui-field">
          <label for="cost-cache-write">Cache write price</label>
          <input id="cost-cache-write" class="ui-input" type="number" min="0" step="0.0001" placeholder="e.g. 0.5" />
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

<script src="../assets/submit-form.js"></script>
