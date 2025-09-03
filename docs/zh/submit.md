## 提交模型（自动生成 PR）

在下方表单填写模型信息并点击「打开 GitHub Issue」。浏览器会打开一个带有预填内容的 Issue 页面。
提交 Issue 后，机器人会自动创建一个 PR，通过 overrides 写入/更新模型，并生成 API 文件。

<script src="https://cdn.tailwindcss.com"></script>
<style>
  .tag-input { position: absolute; opacity: 0; pointer-events: none; }
  .tag-label { transition: none; }
  .tag-input:checked + .tag-label { @apply bg-gray-900 text-white border-gray-900; }
</style>

<div id="model-submit" data-repo="basellm/llm-metadata">
  <form onsubmit="return false" class="max-w-4xl mx-auto bg-white border border-gray-200 rounded-lg p-6 space-y-8">
    
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-gray-900">基础信息</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700" for="providerId">提供商 ID</label>
          <input id="providerId" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" type="text" required placeholder="如 openai" />
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700" for="modelId">模型 ID</label>
          <input id="modelId" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" type="text" required placeholder="如 gpt-4o" />
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700" for="name">显示名称</label>
          <input id="name" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" type="text" placeholder="可选展示名" />
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700" for="icon">图标 URL</label>
          <input id="icon" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" type="url" placeholder="https://..." />
        </div>
      </div>
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700" for="description">描述</label>
        <textarea id="description" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-vertical" rows="3" placeholder="模型的简短描述"></textarea>
      </div>
    </div>

    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-gray-900">能力</h3>
      <div class="flex flex-wrap gap-2">
        <div class="relative">
          <input id="cap-reasoning" type="checkbox" class="tag-input" />
          <label for="cap-reasoning" class="tag-label inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white cursor-pointer select-none">推理</label>
        </div>
        <div class="relative">
          <input id="cap-tools" type="checkbox" class="tag-input" />
          <label for="cap-tools" class="tag-label inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white cursor-pointer select-none">工具调用</label>
        </div>
        <div class="relative">
          <input id="cap-files" type="checkbox" class="tag-input" />
          <label for="cap-files" class="tag-label inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white cursor-pointer select-none">文件附件</label>
        </div>
        <div class="relative">
          <input id="cap-temp" type="checkbox" class="tag-input" />
          <label for="cap-temp" class="tag-label inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white cursor-pointer select-none">温度控制</label>
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-gray-900">模态</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">输入</label>
          <div class="flex flex-wrap gap-2">
            <div class="relative">
              <input class="mod-in tag-input" type="checkbox" id="in-text" value="text" checked />
              <label for="in-text" class="tag-label inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white cursor-pointer select-none">text</label>
            </div>
            <div class="relative">
              <input class="mod-in tag-input" type="checkbox" id="in-image" value="image" />
              <label for="in-image" class="tag-label inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white cursor-pointer select-none">image</label>
            </div>
            <div class="relative">
              <input class="mod-in tag-input" type="checkbox" id="in-audio" value="audio" />
              <label for="in-audio" class="tag-label inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white cursor-pointer select-none">audio</label>
            </div>
            <div class="relative">
              <input class="mod-in tag-input" type="checkbox" id="in-video" value="video" />
              <label for="in-video" class="tag-label inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white cursor-pointer select-none">video</label>
            </div>
            <div class="relative">
              <input class="mod-in tag-input" type="checkbox" id="in-pdf" value="pdf" />
              <label for="in-pdf" class="tag-label inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white cursor-pointer select-none">pdf</label>
            </div>
          </div>
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">输出</label>
          <div class="flex flex-wrap gap-2">
            <div class="relative">
              <input class="mod-out tag-input" type="checkbox" id="out-text" value="text" checked />
              <label for="out-text" class="tag-label inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white cursor-pointer select-none">text</label>
            </div>
            <div class="relative">
              <input class="mod-out tag-input" type="checkbox" id="out-image" value="image" />
              <label for="out-image" class="tag-label inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white cursor-pointer select-none">image</label>
            </div>
            <div class="relative">
              <input class="mod-out tag-input" type="checkbox" id="out-audio" value="audio" />
              <label for="out-audio" class="tag-label inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white cursor-pointer select-none">audio</label>
            </div>
            <div class="relative">
              <input class="mod-out tag-input" type="checkbox" id="out-video" value="video" />
              <label for="out-video" class="tag-label inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white cursor-pointer select-none">video</label>
            </div>
            <div class="relative">
              <input class="mod-out tag-input" type="checkbox" id="out-pdf" value="pdf" />
              <label for="out-pdf" class="tag-label inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white cursor-pointer select-none">pdf</label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-gray-900">限制</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700" for="limit-context">上下文窗口（tokens）</label>
          <input id="limit-context" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" type="number" min="0" placeholder="如 128000" />
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700" for="limit-output">最大输出（tokens）</label>
          <input id="limit-output" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" type="number" min="0" placeholder="如 4096" />
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-gray-900">价格（美元/百万 tokens）</h3>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700" for="cost-input">输入价格</label>
          <input id="cost-input" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" type="number" min="0" step="0.0001" placeholder="如 5" />
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700" for="cost-output">输出价格</label>
          <input id="cost-output" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" type="number" min="0" step="0.0001" placeholder="如 15" />
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700" for="cost-cache">缓存读取价格</label>
          <input id="cost-cache" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" type="number" min="0" step="0.0001" placeholder="如 0.3" />
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-gray-900">操作</h3>
      <div class="flex flex-wrap gap-2">
        <div class="relative">
          <input type="radio" name="action" id="action-create" value="create" checked class="tag-input" />
          <label for="action-create" class="tag-label inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white cursor-pointer select-none">新增</label>
        </div>
        <div class="relative">
          <input type="radio" name="action" id="action-update" value="update" class="tag-input" />
          <label for="action-update" class="tag-label inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white cursor-pointer select-none">修改</label>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap gap-3 items-center pt-4">
      <button id="open-issue" type="button" class="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2">打开 GitHub Issue</button>
      <button id="copy-body" type="button" class="inline-flex items-center px-4 py-2 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2">复制 Issue 内容</button>
      <span id="status" class="text-sm text-gray-500"></span>
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
