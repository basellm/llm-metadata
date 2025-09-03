## 提交模型（自动生成 PR）

在下方表单填写模型信息并点击「打开 GitHub Issue」。浏览器会打开一个带有预填内容的 Issue 页面。
提交 Issue 后，机器人会自动创建一个 PR，通过 overrides 写入/更新模型，并生成 API 文件。

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
    <h3>基础信息</h3>
    <div class="ms-grid-2">
      <div class="ms-field">
        <label for="providerId">提供商 ID</label>
        <input id="providerId" class="ms-input" type="text" required placeholder="如 openai" />
      </div>
      <div class="ms-field">
        <label for="modelId">模型 ID</label>
        <input id="modelId" class="ms-input" type="text" required placeholder="如 gpt-4o" />
      </div>
    </div>
    <div class="ms-grid-2">
      <div class="ms-field">
        <label for="name">名称</label>
        <input id="name" class="ms-input" type="text" placeholder="可选展示名" />
      </div>
      <div class="ms-field">
        <label for="icon">图标 URL</label>
        <input id="icon" class="ms-input" type="url" placeholder="https://..." />
      </div>
    </div>
    <div class="ms-field">
      <label for="description">描述</label>
      <textarea id="description" class="ms-textarea" placeholder="简短说明"></textarea>
    </div>

    <h3>能力</h3>
    <div class="ms-chips">
      <input id="cap-reasoning" type="checkbox" />
      <label for="cap-reasoning">推理</label>
      <input id="cap-tools" type="checkbox" />
      <label for="cap-tools">工具调用</label>
      <input id="cap-files" type="checkbox" />
      <label for="cap-files">文件附件</label>
      <input id="cap-temp" type="checkbox" />
      <label for="cap-temp">温度控制</label>
    </div>

    <h3>模态</h3>
    <div class="ms-grid-2">
      <div class="ms-field">
        <label>输入</label>
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
        <label>输出</label>
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

    <h3>限制</h3>
    <div class="ms-grid-2">
      <div class="ms-field">
        <label for="limit-context">上下文窗口（tokens）</label>
        <input id="limit-context" class="ms-input" type="number" min="0" placeholder="如 128000" />
      </div>
      <div class="ms-field">
        <label for="limit-output">最大输出（tokens）</label>
        <input id="limit-output" class="ms-input" type="number" min="0" placeholder="如 4096" />
      </div>
    </div>

    <h3>价格（美元/百万 tokens）</h3>
    <div class="ms-grid-2" style="grid-template-columns: 1fr 1fr 1fr;">
      <div class="ms-field">
        <label for="cost-input">输入价格</label>
        <input id="cost-input" class="ms-input" type="number" min="0" step="0.0001" placeholder="如 5" />
      </div>
      <div class="ms-field">
        <label for="cost-output">输出价格</label>
        <input id="cost-output" class="ms-input" type="number" min="0" step="0.0001" placeholder="如 15" />
      </div>
      <div class="ms-field">
        <label for="cost-cache">缓存读取价格</label>
        <input id="cost-cache" class="ms-input" type="number" min="0" step="0.0001" placeholder="如 0.3" />
      </div>
    </div>

    <h3>操作</h3>
    <div class="ms-chips" role="group" aria-label="操作">
      <input type="radio" name="action" id="action-create" value="create" checked />
      <label for="action-create">新增</label>
      <input type="radio" name="action" id="action-update" value="update" />
      <label for="action-update">修改</label>
    </div>

    <div class="ms-actions">
      <button id="open-issue" type="button" class="ms-btn primary">打开 GitHub Issue</button>
      <button id="copy-body" type="button" class="ms-btn secondary">复制 Issue 内容</button>
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
        `此 Issue 由网站表单生成。机器人会把它转换为 PR。`,
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
        document.getElementById('status').textContent = '已复制内容，请在页面打开后粘贴';
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
      document.getElementById('status').textContent = '已复制';
    });
  })();
</script>
