---
hide:
  - navigation
  - toc
---

## モデルを提出（自動 PR）

以下のフォームに入力して「GitHub Issue を開く」をクリックします。新しいタブで
テンプレート済みの Issue が開きます。Issue を送信すると、ボットが自動的に PR を
作成し、overrides を通じてモデルを追加/更新し、API ファイルを生成します。

<link rel="stylesheet" href="../../assets/submit-form.css" />
<script src="../../assets/submit-form-i18n.js"></script>

<div id="model-submit" data-repo="basellm/llm-metadata" data-lang="ja">
  <form onsubmit="return false" class="ui-card">
    <div class="ui-section">
      <h3 class="ui-section-title">モード</h3>
      <div class="ui-segment" role="group" aria-label="モード">
        <input type="radio" name="mode" id="mode-single" value="single" checked />
        <label for="mode-single">単一モデル</label>
        <input type="radio" name="mode" id="mode-batch" value="batch" />
        <label for="mode-batch">バッチモデル</label>
      </div>
    </div>

    <div id="single-mode" class="ui-section">
      <h3 class="ui-section-title">アクション</h3>
      <div class="ui-segment" role="group" aria-label="アクション">
        <input type="radio" name="action" id="action-create" value="create" checked />
        <label for="action-create">作成</label>
        <input type="radio" name="action" id="action-update" value="update" />
        <label for="action-update">更新</label>
      </div>
    </div>

    <div id="batch-mode" class="ui-section is-hidden">
      <h3 class="ui-section-title">バッチモデル JSON</h3>
      <div class="ui-field" style="margin-bottom: var(--spacing-3);">
        <label for="batch-json">モデル配列（JSON 形式）</label>
        <button id="batch-template" type="button" class="ui-btn" style="margin: 0 0 var(--spacing-1) 0; width: max-content;">テンプレートを挿入</button>
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
        <label>プレビュー（<span id="batch-count">0</span> 個のモデルを送信します）</label>
        <div id="batch-list" class="ui-muted" style="font-size: 12px; max-height: 200px; overflow-y: auto; border: 1px solid var(--md-default-fg-color--lightest); border-radius: var(--radius-sm); padding: var(--spacing-2);"></div>
      </div>
    </div>

    <div id="single-fields" class="ui-section">
      <h3 class="ui-section-title">基本情報</h3>
      <div class="ui-grid cols-3">
        <div class="ui-field">
          <label for="providerId" class="required">プロバイダー ID</label>
          <input id="providerId" class="ui-input" type="text" required placeholder="例: openai" />
          <select id="providerSelect" class="ui-select is-hidden"></select>
        </div>
        <div class="ui-field">
          <label for="id" class="required">モデル ID</label>
          <input id="id" class="ui-input" type="text" required placeholder="例: gpt-4o" />
          <select id="modelSelect" class="ui-select is-hidden"></select>
        </div>
        <div class="ui-field">
          <label for="name">表示名</label>
          <input id="name" class="ui-input" type="text" placeholder="オプションの表示名" />
        </div>
        <div class="ui-field full">
          <label for="description">説明</label>
          <textarea id="description" class="ui-textarea" placeholder="モデルの簡単な説明"></textarea>
        </div>
      </div>
    </div>

    <div id="single-metadata" class="ui-section">
      <h3 class="ui-section-title">メタ情報</h3>
      <div class="ui-grid cols-3">
        <div class="ui-field">
          <label for="knowledge">ナレッジカットオフ</label>
          <input id="knowledge" class="ui-input" type="text" placeholder="例: 2024-07" />
        </div>
        <div class="ui-field">
          <label for="release-date">リリース日</label>
          <input id="release-date" class="ui-input" type="date" />
        </div>
        <div class="ui-field">
          <label for="last-updated">最終更新</label>
          <input id="last-updated" class="ui-input" type="date" />
        </div>
      </div>
    </div>

    <div id="single-capabilities" class="ui-section">
      <h3 class="ui-section-title">機能</h3>
      <div class="ui-chips">
        <input id="cap-reasoning" type="checkbox" />
        <label for="cap-reasoning">推論</label>
        <input id="cap-tools" type="checkbox" />
        <label for="cap-tools">ツール呼び出し</label>
        <input id="cap-files" type="checkbox" />
        <label for="cap-files">ファイル添付</label>
        <input id="cap-temp" type="checkbox" />
        <label for="cap-temp">温度制御</label>
        <input id="cap-open-weights" type="checkbox" />
        <label for="cap-open-weights">オープンウェイト</label>
      </div>
    </div>

    <div id="single-modalities" class="ui-section">
      <h3 class="ui-section-title">モダリティ</h3>
      <div class="ui-grid cols-2">
        <div class="ui-field">
          <label>入力</label>
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
          <label>出力</label>
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
      <h3 class="ui-section-title">制限</h3>
      <div class="ui-grid cols-2">
        <div class="ui-field">
          <label for="limit-context">コンテキストウィンドウ（トークン）</label>
          <input id="limit-context" class="ui-input" type="number" min="0" placeholder="例: 128000" />
        </div>
        <div class="ui-field">
          <label for="limit-output">最大出力（トークン）</label>
          <input id="limit-output" class="ui-input" type="number" min="0" placeholder="例: 4096" />
        </div>
      </div>
    </div>

    <div id="single-pricing" class="ui-section">
      <h3 class="ui-section-title">価格（USD/100万トークン）</h3>
      <div class="ui-grid cols-2">
        <div class="ui-field">
          <label for="cost-input">入力価格</label>
          <input id="cost-input" class="ui-input" type="number" min="0" step="0.0001" placeholder="例: 5" />
        </div>
        <div class="ui-field">
          <label for="cost-output">出力価格</label>
          <input id="cost-output" class="ui-input" type="number" min="0" step="0.0001" placeholder="例: 15" />
        </div>
        <div class="ui-field">
          <label for="cost-cache-read">キャッシュ読み取り価格</label>
          <input id="cost-cache-read" class="ui-input" type="number" min="0" step="0.0001" placeholder="例: 0.075" />
        </div>
        <div class="ui-field">
          <label for="cost-cache-write">キャッシュ書き込み価格</label>
          <input id="cost-cache-write" class="ui-input" type="number" min="0" step="0.0001" placeholder="例: 0.5" />
        </div>
      </div>
    </div>

    <div class="ui-actions">
      <button id="open-issue" type="button" class="ui-btn primary">GitHub Issue を開く</button>
      <button id="copy-body" type="button" class="ui-btn">Issue 内容をコピー</button>
      <span id="status" class="ui-muted"></span>
    </div>
  </form>
</div>

<script src="../../assets/submit-form.js"></script>
