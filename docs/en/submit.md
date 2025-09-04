---
hide:
  - navigation
  - toc
---

## Submit a model (auto-PR)

Fill the form below and click "Open GitHub Issue". A pre-filled issue will open
in a new tab. After you submit that issue, a bot will automatically create a PR
adding/updating the model via overrides, and generate API files.

<link rel="stylesheet" href="../assets/styles/submit-form.css" />

<div id="model-submit" data-repo="basellm/llm-metadata" data-lang="en">
  <form onsubmit="return false" class="ui-card">
    <div class="ui-section">
      <h3 class="ui-section-title">Mode</h3>
      <div class="ui-segment" role="group" aria-label="Mode">
        <input type="radio" name="mode" id="mode-single" value="single" checked />
        <label for="mode-single">Single Item</label>
        <input type="radio" name="mode" id="mode-batch" value="batch" />
        <label for="mode-batch">Batch Items</label>
      </div>
    </div>

    <div id="submission-type-section" class="ui-section">
      <h3 class="ui-section-title">Submission Type</h3>
      <div class="ui-segment" role="group" aria-label="Submission Type">
        <input type="radio" name="submission-type" id="type-model" value="model" checked />
        <label for="type-model">Model</label>
        <input type="radio" name="submission-type" id="type-provider" value="provider" />
        <label for="type-provider">Provider</label>
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
      <h3 class="ui-section-title">Batch Items JSON</h3>
      <div class="ui-field" style="margin-bottom: var(--spacing-3);">
        <label for="batch-json">Item Array (JSON format)</label>
        <button id="batch-template" type="button" class="ui-btn" style="margin: 0 0 var(--spacing-1) 0; width: max-content;">Fill template</button>
        <textarea id="batch-json" class="ui-textarea" rows="12" placeholder='[

{
"schema": "model-submission",
"action": "create",
"providerId": "examplecorp",
"id": "novus-1",
"i18n": {
"name": { "en": "Novus 1", "zh": "Novus 1", "ja": "Novus 1" },
"description": { "en": "Fictional example multimodal model.", "zh": "虚构示例多模态模型。", "ja": "架空のマルチモーダルモデル例。" }
}
},
{
"schema": "model-submission",
"action": "update",
"providerId": "deepseek",
"id": "deepseek-chat",
"i18n": {
"name": { "en": "DeepSeek Chat", "zh": "DeepSeek Chat", "ja": "DeepSeek Chat" },
"description": { "en": "Advanced conversational AI model for natural language processing.", "zh": "用于自然语言处理的先进对话AI模型。", "ja": "自然言語処理のための高度な対話AIモデル。" }
}
}
]'></textarea>

</div>
<div id="batch-preview" class="ui-field">
<label>Preview (will submit <span id="batch-count">0</span> items)</label>
<div id="batch-list" class="ui-muted" style="font-size: 12px; max-height: 200px; overflow-y: auto; border: 1px solid var(--md-default-fg-color--lightest); border-radius: var(--radius-sm); padding: var(--spacing-2);"></div>
</div>
</div>

    <!-- Provider Fields -->
    <div id="provider-fields" class="ui-section is-hidden">
      <h3 class="ui-section-title">Provider Information</h3>
      <div class="ui-grid cols-2">
        <div class="ui-field">
          <label for="provider-id" class="required">Provider ID</label>
          <input id="provider-id" class="ui-input" type="text" required placeholder="e.g. openai" />
          <select id="provider-select" class="ui-select is-hidden"></select>
        </div>
        <div class="ui-field">
          <label for="provider-api">API Documentation URL</label>
          <input id="provider-api" class="ui-input" type="url" placeholder="e.g. https://platform.openai.com/docs" />
        </div>
        <div class="ui-field">
          <label for="provider-icon-url">Icon URL</label>
          <input id="provider-icon-url" class="ui-input" type="url" placeholder="e.g. https://..." />
        </div>
        <div class="ui-field">
          <label for="provider-lobe-icon">Lobe Icon</label>
          <input id="provider-lobe-icon" class="ui-input" type="text" placeholder="e.g. OpenAI.Color" />
        </div>
      </div>
    </div>

    <!-- Provider i18n -->
    <div id="provider-i18n" class="ui-section is-hidden">
      <h3 class="ui-section-title">Provider i18n</h3>
      <details class="ui-field" open><summary>Localized provider name and description</summary>
        <div class="ui-grid cols-3">
          <div class="ui-field">
            <label for="provider-i18n-name-en">Name (en)</label>
            <input id="provider-i18n-name-en" class="ui-input" type="text" placeholder="English name" />
          </div>
          <div class="ui-field">
            <label for="provider-i18n-name-zh">名称 (zh)</label>
            <input id="provider-i18n-name-zh" class="ui-input" type="text" placeholder="中文名称" />
          </div>
          <div class="ui-field">
            <label for="provider-i18n-name-ja">名前 (ja)</label>
            <input id="provider-i18n-name-ja" class="ui-input" type="text" placeholder="日本語の名前" />
          </div>
          <div class="ui-field full">
            <label for="provider-i18n-desc-en">Description (en)</label>
            <textarea id="provider-i18n-desc-en" class="ui-textarea" placeholder="English description"></textarea>
          </div>
          <div class="ui-field full">
            <label for="provider-i18n-desc-zh">描述 (zh)</label>
            <textarea id="provider-i18n-desc-zh" class="ui-textarea" placeholder="中文描述"></textarea>
          </div>
          <div class="ui-field full">
            <label for="provider-i18n-desc-ja">説明 (ja)</label>
            <textarea id="provider-i18n-desc-ja" class="ui-textarea" placeholder="日本語の説明"></textarea>
          </div>
        </div>
      </details>
    </div>

    <!-- Model Fields -->
    <div id="model-fields" class="ui-section">
      <h3 class="ui-section-title">Model Information</h3>
      <div class="ui-grid cols-2">
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
      </div>
    </div>

    <!-- Model-specific sections (hidden when provider is selected) -->
    <div id="model-i18n" class="ui-section">
      <h3 class="ui-section-title">Model i18n</h3>
      <details class="ui-field" open><summary>Localized model name and description</summary>
        <div class="ui-grid cols-3">
          <div class="ui-field">
            <label for="i18n-name-en">Name (en)</label>
            <input id="i18n-name-en" class="ui-input" type="text" placeholder="English name" />
          </div>
          <div class="ui-field">
            <label for="i18n-name-zh">名称 (zh)</label>
            <input id="i18n-name-zh" class="ui-input" type="text" placeholder="中文名称" />
          </div>
          <div class="ui-field">
            <label for="i18n-name-ja">名前 (ja)</label>
            <input id="i18n-name-ja" class="ui-input" type="text" placeholder="日本語の名前" />
          </div>
          <div class="ui-field full">
            <label for="i18n-desc-en">Description (en)</label>
            <textarea id="i18n-desc-en" class="ui-textarea" placeholder="English description"></textarea>
          </div>
          <div class="ui-field full">
            <label for="i18n-desc-zh">描述 (zh)</label>
            <textarea id="i18n-desc-zh" class="ui-textarea" placeholder="中文描述"></textarea>
          </div>
          <div class="ui-field full">
            <label for="i18n-desc-ja">説明 (ja)</label>
            <textarea id="i18n-desc-ja" class="ui-textarea" placeholder="日本語の説明"></textarea>
          </div>
        </div>
      </details>
    </div>

    <div id="model-metadata" class="ui-section">
      <h3 class="ui-section-title">Model Metadata</h3>
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

    <div id="model-capabilities" class="ui-section">
      <h3 class="ui-section-title">Model Capabilities</h3>
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

    <div id="model-modalities" class="ui-section">
      <h3 class="ui-section-title">Model Modalities</h3>
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

    <div id="model-limits" class="ui-section">
      <h3 class="ui-section-title">Model Limits</h3>
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

    <div id="model-pricing" class="ui-section">
      <h3 class="ui-section-title">Model Pricing (USD per 1M tokens)</h3>
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

<!-- Modular Submit Form Scripts -->
<script type="module" src="../assets/index.js"></script>
