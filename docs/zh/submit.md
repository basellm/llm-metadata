## 提交模型（自动生成 PR）

在下方表单填写模型信息并点击「打开 GitHub Issue」。浏览器会打开一个带有预填内容的 Issue 页面。
提交 Issue 后，机器人会自动创建一个 PR，通过 overrides 写入/更新模型，并生成 API 文件。

<div id="model-submit" data-repo="basellm/llm-metadata">
  <form onsubmit="return false" style="max-width: 880px">
    <h3>基础信息</h3>
    <div class="grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <label>
        提供商 ID
        <input id="providerId" type="text" required placeholder="如 openai" />
      </label>
      <label>
        模型 ID
        <input id="modelId" type="text" required placeholder="如 gpt-4o" />
      </label>
    </div>
    <div class="grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <label>
        名称
        <input id="name" type="text" placeholder="可选展示名" />
      </label>
      <label>
        图标 URL
        <input id="icon" type="url" placeholder="https://..." />
      </label>
    </div>
    <label>
      描述
      <textarea id="description" rows="4" placeholder="简短说明"></textarea>
    </label>

    <h3>能力</h3>
    <div style="display:flex;gap:16px;flex-wrap:wrap;">
      <label><input id="cap-reasoning" type="checkbox" /> 推理</label>
      <label><input id="cap-tools" type="checkbox" /> 工具调用</label>
      <label><input id="cap-files" type="checkbox" /> 文件附件</label>
      <label><input id="cap-temp" type="checkbox" /> 温度控制</label>
    </div>

    <h3>模态</h3>
    <div class="grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div>
        <div>输入</div>
        <label><input class="mod-in" type="checkbox" value="text" checked /> text</label>
        <label><input class="mod-in" type="checkbox" value="image" /> image</label>
        <label><input class="mod-in" type="checkbox" value="audio" /> audio</label>
      </div>
      <div>
        <div>输出</div>
        <label><input class="mod-out" type="checkbox" value="text" checked /> text</label>
        <label><input class="mod-out" type="checkbox" value="image" /> image</label>
        <label><input class="mod-out" type="checkbox" value="audio" /> audio</label>
      </div>
    </div>

    <h3>限制</h3>
    <div class="grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <label>
        上下文窗口（tokens）
        <input id="limit-context" type="number" min="0" placeholder="如 128000" />
      </label>
      <label>
        最大输出（tokens）
        <input id="limit-output" type="number" min="0" placeholder="如 4096" />
      </label>
    </div>

    <h3>价格（美元/百万 tokens）</h3>
    <div class="grid" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
      <label>
        输入价格
        <input id="cost-input" type="number" min="0" step="0.0001" placeholder="如 5" />
      </label>
      <label>
        输出价格
        <input id="cost-output" type="number" min="0" step="0.0001" placeholder="如 15" />
      </label>
      <label>
        缓存读取价格
        <input id="cost-cache" type="number" min="0" step="0.0001" placeholder="如 0.3" />
      </label>
    </div>

    <h3>操作</h3>
    <label><input type="radio" name="action" value="create" checked /> 新增</label>
    <label><input type="radio" name="action" value="update" /> 修改</label>

    <div style="margin-top:16px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
      <button id="open-issue" type="button">打开 GitHub Issue</button>
      <button id="copy-body" type="button">复制 Issue 内容</button>
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
