## モデルを提出（自動 PR）

以下のフォームに入力して「GitHub Issue を開く」をクリックします。新しいタブで
テンプレート済みの Issue が開きます。Issue を送信すると、ボットが自動的に PR を
作成し、overrides を通じてモデルを追加/更新し、API ファイルを生成します。

<style>
  .ms-card {background: var(--md-default-bg-color, #fff); border: 1px solid var(--md-default-fg-color--lightest, #e5e7eb); border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,.04); padding: 18px;}
  .ms-grid-2 {display:grid; grid-template-columns: 1fr; gap:12px;}
  @media (min-width: 720px){ .ms-grid-2 {grid-template-columns: 1fr 1fr;} }
  .ms-field label {display:block; font-weight:600; margin-bottom:6px;}
  .ms-input, .ms-textarea {width:100%; padding:10px 12px; border:1px solid var(--md-default-fg-color--lightest, #e5e7eb); background: var(--md-code-bg-color, #f6f8fa); border-radius:8px;}
  .ms-textarea {min-height: 96px;}
  .ms-chips {display:flex; flex-wrap: wrap; gap:8px;}
  .ms-chips input {position:absolute; opacity:0; pointer-events:none;}
  .ms-chips label {padding:6px 12px; border-radius:999px; border:1px solid var(--md-default-fg-color--lightest,#e5e7eb); cursor:pointer; user-select:none;}
  .ms-chips input:checked + label {background: var(--md-primary-fg-color,#4051b5); color: var(--md-primary-bg-color,#fff); border-color: var(--md-primary-fg-color,#4051b5);} 
  .ms-actions {margin-top:16px; display:flex; gap:12px; flex-wrap:wrap; align-items:center;}
  .ms-btn {appearance:none; border:1px solid transparent; border-radius:10px; padding:10px 14px; font-weight:600; cursor:pointer;}
  .ms-btn.primary {background: var(--md-primary-fg-color,#4051b5); color: var(--md-primary-bg-color,#fff);} 
  .ms-btn.secondary {background: var(--md-code-bg-color,#f6f8fa);} 
  .ms-muted {opacity:.85;}
</style>

<div id="model-submit" data-repo="basellm/llm-metadata">
  <form onsubmit="return false" style="max-width: 880px" class="ms-card">
    <h3>基本</h3>
    <div class="ms-grid-2">
      <div class="ms-field">
        <label for="providerId">Provider ID</label>
        <input id="providerId" class="ms-input" type="text" required placeholder="例: openai" />
      </div>
      <div class="ms-field">
        <label for="modelId">Model ID</label>
        <input id="modelId" class="ms-input" type="text" required placeholder="例: gpt-4o" />
      </div>
    </div>
    <div class="ms-grid-2">
      <div class="ms-field">
        <label for="name">Name</label>
        <input id="name" class="ms-input" type="text" placeholder="表示名（任意）" />
      </div>
      <div class="ms-field">
        <label for="icon">Icon URL</label>
        <input id="icon" class="ms-input" type="url" placeholder="https://..." />
      </div>
    </div>
    <div class="ms-field">
      <label for="description">説明</label>
      <textarea id="description" class="ms-textarea" placeholder="短い説明"></textarea>
    </div>

    <h3>機能</h3>
    <div class="ms-chips">
      <input id="cap-reasoning" type="checkbox" />
      <label for="cap-reasoning">推論</label>
      <input id="cap-tools" type="checkbox" />
      <label for="cap-tools">ツール呼び出し</label>
      <input id="cap-files" type="checkbox" />
      <label for="cap-files">ファイル添付</label>
      <input id="cap-temp" type="checkbox" />
      <label for="cap-temp">温度制御</label>
    </div>

    <h3>モダリティ</h3>
    <div class="ms-grid-2">
      <div class="ms-field">
        <label>入力</label>
        <div class="ms-chips">
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
      <div class="ms-field">
        <label>出力</label>
        <div class="ms-chips">
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

    <h3>制限</h3>
    <div class="ms-grid-2">
      <div class="ms-field">
        <label for="limit-context">コンテキスト（tokens）</label>
        <input id="limit-context" class="ms-input" type="number" min="0" placeholder="例: 128000" />
      </div>
      <div class="ms-field">
        <label for="limit-output">最大出力（tokens）</label>
        <input id="limit-output" class="ms-input" type="number" min="0" placeholder="例: 4096" />
      </div>
    </div>

    <h3>価格（USD / 100万 tokens）</h3>
    <div class="ms-grid-2" style="grid-template-columns: 1fr 1fr 1fr;">
      <div class="ms-field">
        <label for="cost-input">入力単価</label>
        <input id="cost-input" class="ms-input" type="number" min="0" step="0.0001" placeholder="例: 5" />
      </div>
      <div class="ms-field">
        <label for="cost-output">出力単価</label>
        <input id="cost-output" class="ms-input" type="number" min="0" step="0.0001" placeholder="例: 15" />
      </div>
      <div class="ms-field">
        <label for="cost-cache">キャッシュ読み出し単価</label>
        <input id="cost-cache" class="ms-input" type="number" min="0" step="0.0001" placeholder="例: 0.3" />
      </div>
    </div>

    <h3>操作</h3>
    <div class="ms-chips" role="group" aria-label="操作">
      <input type="radio" name="action" id="action-create" value="create" checked />
      <label for="action-create">追加</label>
      <input type="radio" name="action" id="action-update" value="update" />
      <label for="action-update">更新</label>
    </div>

    <div class="ms-actions">
      <button id="open-issue" type="button" class="ms-btn primary">GitHub Issue を開く</button>
      <button id="copy-body" type="button" class="ms-btn secondary">Issue 本文をコピー</button>
      <span id="status" class="ms-muted"></span>
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
        reasoning: checked('cap-reasoning') || undefined,
        tool_call: checked('cap-tools') || undefined,
        attachment: checked('cap-files') || undefined,
        temperature: checked('cap-temp') || undefined,
        icon: value('icon') || undefined,
        modalities: { input: gather('mod-in'), output: gather('mod-out') },
        limit: { context: num('limit-context'), output: num('limit-output') },
        cost: { input: num('cost-input'), output: num('cost-output'), cache_read: num('cost-cache') },
      };
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
      const body = [
        `この Issue はウェブサイトのフォームから生成されました。ボットが PR に変換します。`,
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
        document.getElementById('status').textContent = '本文をコピーしました。ページが開いたら貼り付けてください。';
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
      document.getElementById('status').textContent = 'コピーしました';
    });
  })();
</script>
