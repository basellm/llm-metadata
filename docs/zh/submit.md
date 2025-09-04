---
hide:
  - navigation
  - toc
---

## 提交模型（自动生成 PR）

在下方表单填写模型信息并点击「打开 GitHub Issue」。浏览器会打开一个带有预填内容的 Issue 页面。
提交 Issue 后，机器人会自动创建一个 PR，通过 overrides 写入/更新模型，并生成 API 文件。

<link rel="stylesheet" href="../../assets/submit-form.css" />
<script src="../../assets/submit-form-i18n.js"></script>

<div id="model-submit" data-repo="basellm/llm-metadata" data-lang="zh">
  <form onsubmit="return false" class="ui-card">
    <div class="ui-section">
      <h3 class="ui-section-title">操作模式</h3>
      <div class="ui-segment" role="group" aria-label="操作模式">
        <input type="radio" name="mode" id="mode-single" value="single" checked />
        <label for="mode-single">单个模型</label>
        <input type="radio" name="mode" id="mode-batch" value="batch" />
        <label for="mode-batch">批量模型</label>
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
      <h3 class="ui-section-title">批量模型 JSON</h3>
      <div class="ui-field" style="margin-bottom: var(--spacing-3);">
        <label for="batch-json">模型数组（JSON 格式）</label>
        <button id="batch-template" type="button" class="ui-btn" style="margin: 0 0 var(--spacing-1) 0; width: max-content;">填入模板</button>
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
<label>预览（将提交 <span id="batch-count">0</span> 个模型）</label>
<div id="batch-list" class="ui-muted" style="font-size: 12px; max-height: 200px; overflow-y: auto; border: 1px solid var(--md-default-fg-color--lightest); border-radius: var(--radius-sm); padding: var(--spacing-2);"></div>
</div>
</div>

    <div id="single-fields" class="ui-section">
      <h3 class="ui-section-title">基础信息</h3>
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

    <div id="single-i18n" class="ui-section">
      <h3 class="ui-section-title">多语言</h3>
      <details class="ui-field" open><summary>名称与描述的多语言版本</summary>
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

    <div id="single-metadata" class="ui-section">
      <h3 class="ui-section-title">元信息</h3>
      <div class="ui-grid cols-3">
        <div class="ui-field">
          <label for="knowledge">知识截止</label>
          <input id="knowledge" class="ui-input" type="text" placeholder="例如 2024-07" />
        </div>
        <div class="ui-field">
          <label for="release-date">发布日期</label>
          <input id="release-date" class="ui-input" type="date" />
        </div>
        <div class="ui-field">
          <label for="last-updated">最近更新</label>
          <input id="last-updated" class="ui-input" type="date" />
        </div>
      </div>
    </div>

    <div id="single-capabilities" class="ui-section">
      <h3 class="ui-section-title">能力</h3>
      <div class="ui-chips">
        <input id="cap-reasoning" type="checkbox" />
        <label for="cap-reasoning">推理</label>
        <input id="cap-tools" type="checkbox" />
        <label for="cap-tools">工具调用</label>
        <input id="cap-files" type="checkbox" />
        <label for="cap-files">文件附件</label>
        <input id="cap-temp" type="checkbox" />
        <label for="cap-temp">温度控制</label>
        <input id="cap-open-weights" type="checkbox" />
        <label for="cap-open-weights">开放权重</label>
      </div>
    </div>

    <div id="single-modalities" class="ui-section">
      <h3 class="ui-section-title">模态</h3>
      <div class="ui-grid cols-2">
        <div class="ui-field">
          <label>输入</label>
          <div class="ui-chips">
            <input class="mod-in" type="checkbox" id="in-text" value="text" checked />
            <label for="in-text">文本</label>
            <input class="mod-in" type="checkbox" id="in-image" value="image" />
            <label for="in-image">图片</label>
            <input class="mod-in" type="checkbox" id="in-audio" value="audio" />
            <label for="in-audio">音频</label>
            <input class="mod-in" type="checkbox" id="in-video" value="video" />
            <label for="in-video">视频</label>
            <input class="mod-in" type="checkbox" id="in-pdf" value="pdf" />
            <label for="in-pdf">PDF</label>
          </div>
        </div>
        <div class="ui-field">
          <label>输出</label>
          <div class="ui-chips">
            <input class="mod-out" type="checkbox" id="out-text" value="text" checked />
            <label for="out-text">文本</label>
            <input class="mod-out" type="checkbox" id="out-image" value="image" />
            <label for="out-image">图片</label>
            <input class="mod-out" type="checkbox" id="out-audio" value="audio" />
            <label for="out-audio">音频</label>
            <input class="mod-out" type="checkbox" id="out-video" value="video" />
            <label for="out-video">视频</label>
            <input class="mod-out" type="checkbox" id="out-pdf" value="pdf" />
            <label for="out-pdf">PDF</label>
          </div>
        </div>
      </div>
    </div>

    <div id="single-limits" class="ui-section">
      <h3 class="ui-section-title">限制</h3>
      <div class="ui-grid cols-2">
        <div class="ui-field">
          <label for="limit-context">上下文窗口（tokens）</label>
          <input id="limit-context" class="ui-input" type="number" min="0" placeholder="如 128000" />
        </div>
        <div class="ui-field">
          <label for="limit-output">最大输出（tokens）</label>
          <input id="limit-output" class="ui-input" type="number" min="0" placeholder="如 4096" />
        </div>
      </div>
    </div>

    <div id="single-pricing" class="ui-section">
      <h3 class="ui-section-title">价格（美元/百万 tokens）</h3>
      <div class="ui-grid cols-2">
        <div class="ui-field">
          <label for="cost-input">输入价格</label>
          <input id="cost-input" class="ui-input" type="number" min="0" step="0.0001" placeholder="如 5" />
        </div>
        <div class="ui-field">
          <label for="cost-output">输出价格</label>
          <input id="cost-output" class="ui-input" type="number" min="0" step="0.0001" placeholder="如 15" />
        </div>
        <div class="ui-field">
          <label for="cost-cache-read">缓存读取价格</label>
          <input id="cost-cache-read" class="ui-input" type="number" min="0" step="0.0001" placeholder="如 0.075" />
        </div>
        <div class="ui-field">
          <label for="cost-cache-write">缓存写入价格</label>
          <input id="cost-cache-write" class="ui-input" type="number" min="0" step="0.0001" placeholder="如 0.5" />
        </div>
      </div>
    </div>

    <div class="ui-actions">
      <button id="open-issue" type="button" class="ui-btn primary">打开 GitHub Issue</button>
      <button id="copy-body" type="button" class="ui-btn">复制 Issue 内容</button>
      <span id="status" class="ui-muted"></span>
    </div>

  </form>
</div>

<script src="../../assets/submit-form.js"></script>
