---
hide:
  - navigation
  - toc
---

## 提交模型（自動生成 PR）

在下方表單填寫模型資訊並點擊「打開 GitHub Issue」。瀏覽器會打開一個帶有預填內容的 Issue 頁面。
提交 Issue 後，機器人會自動建立一個 PR，通過 overrides 寫入/更新模型，並生成 API 檔案。

<link rel="stylesheet" href="../../assets/styles/submit-form.css" />

<div id="model-submit" data-repo="basellm/llm-metadata" data-lang="zh">
  <form onsubmit="return false" class="ui-card">
    <div class="ui-section">
      <h3 class="ui-section-title">操作模式</h3>
      <div class="ui-segment" role="group" aria-label="操作模式">
        <input type="radio" name="mode" id="mode-single" value="single" checked />
        <label for="mode-single">單個項目</label>
        <input type="radio" name="mode" id="mode-batch" value="batch" />
        <label for="mode-batch">批量項目</label>
      </div>
    </div>

    <div id="submission-type-section" class="ui-section">
      <h3 class="ui-section-title">提交類型</h3>
      <div class="ui-segment" role="group" aria-label="提交類型">
        <input type="radio" name="submission-type" id="type-model" value="model" checked />
        <label for="type-model">模型</label>
        <input type="radio" name="submission-type" id="type-provider" value="provider" />
        <label for="type-provider">供應商</label>
      </div>
    </div>

    <div id="single-mode" class="ui-section">
      <h3 class="ui-section-title">操作</h3>
      <div class="ui-segment" role="group" aria-label="操作">
        <input type="radio" name="action" id="action-create" value="create" checked />
        <label for="action-create">新增</label>
        <input type="radio" name="action" id="action-update" value="update" />
        <label for="action-update">修改</label>
      </div>
    </div>

    <div id="batch-mode" class="ui-section is-hidden">
      <h3 class="ui-section-title">批量項目 JSON</h3>
      <div class="ui-field" style="margin-bottom: var(--spacing-3);">
        <label for="batch-json">項目陣列（JSON 格式）</label>
        <button id="batch-template" type="button" class="ui-btn" style="margin: 0 0 var(--spacing-1) 0; width: max-content;">填入模板</button>
        <textarea id="batch-json" class="ui-textarea" rows="12" placeholder='[

{
"schema": "model-submission",
"action": "create",
"providerId": "examplecorp",
"id": "novus-1",
"i18n": {
"name": { "en": "Novus 1", "zh": "Novus 1", "ja": "Novus 1" },
"description": { "en": "Fictional example multimodal model.", "zh": "虛構示例多模態模型。", "ja": "架空のマルチモーダルモデル例。" }
}
},
{
"schema": "model-submission",
"action": "update",
"providerId": "deepseek",
"id": "deepseek-chat",
"i18n": {
"name": { "en": "DeepSeek Chat", "zh": "DeepSeek Chat", "ja": "DeepSeek Chat" },
"description": { "en": "Advanced conversational AI model for natural language processing.", "zh": "用於自然語言處理的先進對話AI模型。", "ja": "自然言語処理のための高度な対話AIモデル。" }
}
}
]'></textarea>

</div>
<div id="batch-preview" class="ui-field">
<label>預覽（將提交 <span id="batch-count">0</span> 個項目）</label>
<div id="batch-list" class="ui-muted" style="font-size: 12px; max-height: 200px; overflow-y: auto; border: 1px solid var(--md-default-fg-color--lightest); border-radius: var(--radius-sm); padding: var(--spacing-2);"></div>
</div>
</div>

    <!-- 供應商字段 -->
    <div id="provider-fields" class="ui-section is-hidden">
      <h3 class="ui-section-title">供應商資訊</h3>
      <div class="ui-grid cols-2">
        <div class="ui-field">
          <label for="provider-id" class="required">供應商 ID</label>
          <input id="provider-id" class="ui-input" type="text" required placeholder="如 openai" />
          <select id="provider-select" class="ui-select is-hidden"></select>
        </div>
        <div class="ui-field">
          <label for="provider-api">API 文件 URL</label>
          <input id="provider-api" class="ui-input" type="url" placeholder="如 https://platform.openai.com/docs" />
        </div>
        <div class="ui-field">
          <label for="provider-icon-url">圖示 URL</label>
          <input id="provider-icon-url" class="ui-input" type="url" placeholder="如 https://..." />
        </div>
        <div class="ui-field">
          <label for="provider-lobe-icon">Lobe 圖示</label>
          <input id="provider-lobe-icon" class="ui-input" type="text" placeholder="如 OpenAI.Color" />
        </div>
      </div>
    </div>

    <!-- 供應商多語言 -->
    <div id="provider-i18n" class="ui-section is-hidden">
      <h3 class="ui-section-title">供應商多語言</h3>
      <details class="ui-field" open><summary>供應商名稱與描述的多語言版本</summary>
        <div class="ui-grid cols-3">
          <div class="ui-field">
            <label for="provider-i18n-name-en">Name (en)</label>
            <input id="provider-i18n-name-en" class="ui-input" type="text" placeholder="English name" />
          </div>
          <div class="ui-field">
            <label for="provider-i18n-name-zh">名稱 (zh)</label>
            <input id="provider-i18n-name-zh" class="ui-input" type="text" placeholder="中文名稱" />
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

    <!-- 模型字段 -->
    <div id="model-fields" class="ui-section">
      <h3 class="ui-section-title">模型資訊</h3>
      <div class="ui-grid cols-2">
        <div class="ui-field">
          <label for="providerId" class="required">提供商 ID</label>
          <input id="providerId" class="ui-input" type="text" required placeholder="如 openai" />
          <select id="providerSelect" class="ui-select is-hidden"></select>
        </div>
        <div class="ui-field">
          <label for="id" class="required">模型 ID</label>
          <input id="id" class="ui-input" type="text" required placeholder="如 gpt-4o" />
          <select id="modelSelect" class="ui-select is-hidden"></select>
        </div>
      </div>
    </div>

    <!-- 模型專用區域（選擇供應商時隱藏） -->
    <div id="model-i18n" class="ui-section">
      <h3 class="ui-section-title">模型多語言</h3>
      <details class="ui-field" open><summary>模型名稱與描述的多語言版本</summary>
        <div class="ui-grid cols-3">
          <div class="ui-field">
            <label for="i18n-name-en">Name (en)</label>
            <input id="i18n-name-en" class="ui-input" type="text" placeholder="English name" />
          </div>
          <div class="ui-field">
            <label for="i18n-name-zh">名稱 (zh)</label>
            <input id="i18n-name-zh" class="ui-input" type="text" placeholder="中文名稱" />
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
      <h3 class="ui-section-title">模型元資訊</h3>
      <div class="ui-grid cols-3">
        <div class="ui-field">
          <label for="knowledge">知識截止</label>
          <input id="knowledge" class="ui-input" type="text" placeholder="例如 2024-07" />
        </div>
        <div class="ui-field">
          <label for="release-date">發佈日期</label>
          <input id="release-date" class="ui-input" type="date" />
        </div>
        <div class="ui-field">
          <label for="last-updated">最近更新</label>
          <input id="last-updated" class="ui-input" type="date" />
        </div>
      </div>
    </div>

    <div id="model-capabilities" class="ui-section">
      <h3 class="ui-section-title">模型能力</h3>
      <div class="ui-chips">
        <input id="cap-reasoning" type="checkbox" />
        <label for="cap-reasoning">推理</label>
        <input id="cap-tools" type="checkbox" />
        <label for="cap-tools">工具調用</label>
        <input id="cap-files" type="checkbox" />
        <label for="cap-files">檔案附件</label>
        <input id="cap-temp" type="checkbox" />
        <label for="cap-temp">溫度控制</label>
        <input id="cap-open-weights" type="checkbox" />
        <label for="cap-open-weights">開放權重</label>
      </div>
    </div>

    <div id="model-modalities" class="ui-section">
      <h3 class="ui-section-title">模型模態</h3>
      <div class="ui-grid cols-2">
        <div class="ui-field">
          <label>輸入</label>
          <div class="ui-chips">
            <input class="mod-in" type="checkbox" id="in-text" value="text" checked />
            <label for="in-text">文本</label>
            <input class="mod-in" type="checkbox" id="in-image" value="image" />
            <label for="in-image">圖片</label>
            <input class="mod-in" type="checkbox" id="in-audio" value="audio" />
            <label for="in-audio">音訊</label>
            <input class="mod-in" type="checkbox" id="in-video" value="video" />
            <label for="in-video">影片</label>
            <input class="mod-in" type="checkbox" id="in-pdf" value="pdf" />
            <label for="in-pdf">PDF</label>
          </div>
        </div>
        <div class="ui-field">
          <label>輸出</label>
          <div class="ui-chips">
            <input class="mod-out" type="checkbox" id="out-text" value="text" checked />
            <label for="out-text">文本</label>
            <input class="mod-out" type="checkbox" id="out-image" value="image" />
            <label for="out-image">圖片</label>
            <input class="mod-out" type="checkbox" id="out-audio" value="audio" />
            <label for="out-audio">音訊</label>
            <input class="mod-out" type="checkbox" id="out-video" value="video" />
            <label for="out-video">影片</label>
            <input class="mod-out" type="checkbox" id="out-pdf" value="pdf" />
            <label for="out-pdf">PDF</label>
          </div>
        </div>
      </div>
    </div>

    <div id="model-limits" class="ui-section">
      <h3 class="ui-section-title">模型限制</h3>
      <div class="ui-grid cols-2">
        <div class="ui-field">
          <label for="limit-context">上下文窗口（tokens）</label>
          <input id="limit-context" class="ui-input" type="number" min="0" placeholder="如 128000" />
        </div>
        <div class="ui-field">
          <label for="limit-output">最大輸出（tokens）</label>
          <input id="limit-output" class="ui-input" type="number" min="0" placeholder="如 4096" />
        </div>
      </div>
    </div>

    <div id="model-pricing" class="ui-section">
      <h3 class="ui-section-title">模型價格（美元/百萬 tokens）</h3>
      <div class="ui-grid cols-2">
        <div class="ui-field">
          <label for="cost-input">輸入價格</label>
          <input id="cost-input" class="ui-input" type="number" min="0" step="0.0001" placeholder="如 5" />
        </div>
        <div class="ui-field">
          <label for="cost-output">輸出價格</label>
          <input id="cost-output" class="ui-input" type="number" min="0" step="0.0001" placeholder="如 15" />
        </div>
        <div class="ui-field">
          <label for="cost-cache-read">快取讀取價格</label>
          <input id="cost-cache-read" class="ui-input" type="number" min="0" step="0.0001" placeholder="如 0.075" />
        </div>
        <div class="ui-field">
          <label for="cost-cache-write">快取寫入價格</label>
          <input id="cost-cache-write" class="ui-input" type="number" min="0" step="0.0001" placeholder="如 0.5" />
        </div>
      </div>
    </div>

    <div class="ui-actions">
      <button id="open-issue" type="button" class="ui-btn primary">打開 GitHub Issue</button>
      <button id="copy-body" type="button" class="ui-btn">複製 Issue 內容</button>
      <span id="status" class="ui-muted"></span>
    </div>

  </form>
</div>

<!-- 模組化提交表單腳本 -->
<script type="module" src="../../assets/index.js"></script>
