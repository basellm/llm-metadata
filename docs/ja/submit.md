## モデルを提出（自動 PR）

以下のフォームに入力して「GitHub Issue を開く」をクリックします。新しいタブで
テンプレート済みの Issue が開きます。Issue を送信すると、ボットが自動的に PR を
作成し、overrides を通じてモデルを追加/更新し、API ファイルを生成します。

<div id="model-submit" data-repo="basellm/llm-metadata">
  <form onsubmit="return false" style="max-width: 880px">
    <h3>基本</h3>
    <div class="grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <label>
        Provider ID
        <input id="providerId" type="text" required placeholder="例: openai" />
      </label>
      <label>
        Model ID
        <input id="modelId" type="text" required placeholder="例: gpt-4o" />
      </label>
    </div>
    <div class="grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <label>
        Name
        <input id="name" type="text" placeholder="表示名（任意）" />
      </label>
      <label>
        Icon URL
        <input id="icon" type="url" placeholder="https://..." />
      </label>
    </div>
    <label>
      説明
      <textarea id="description" rows="4" placeholder="短い説明"></textarea>
    </label>

    <h3>機能</h3>
    <div style="display:flex;gap:16px;flex-wrap:wrap;">
      <label><input id="cap-reasoning" type="checkbox" /> 推論</label>
      <label><input id="cap-tools" type="checkbox" /> ツール呼び出し</label>
      <label><input id="cap-files" type="checkbox" /> ファイル添付</label>
      <label><input id="cap-temp" type="checkbox" /> 温度制御</label>
    </div>

    <h3>モダリティ</h3>
    <div class="grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div>
        <div>入力</div>
        <label><input class="mod-in" type="checkbox" value="text" checked /> text</label>
        <label><input class="mod-in" type="checkbox" value="image" /> image</label>
        <label><input class="mod-in" type="checkbox" value="audio" /> audio</label>
      </div>
      <div>
        <div>出力</div>
        <label><input class="mod-out" type="checkbox" value="text" checked /> text</label>
        <label><input class="mod-out" type="checkbox" value="image" /> image</label>
        <label><input class="mod-out" type="checkbox" value="audio" /> audio</label>
      </div>
    </div>

    <h3>制限</h3>
    <div class="grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <label>
        コンテキスト（tokens）
        <input id="limit-context" type="number" min="0" placeholder="例: 128000" />
      </label>
      <label>
        最大出力（tokens）
        <input id="limit-output" type="number" min="0" placeholder="例: 4096" />
      </label>
    </div>

    <h3>価格（USD / 100万 tokens）</h3>
    <div class="grid" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
      <label>
        入力単価
        <input id="cost-input" type="number" min="0" step="0.0001" placeholder="例: 5" />
      </label>
      <label>
        出力単価
        <input id="cost-output" type="number" min="0" step="0.0001" placeholder="例: 15" />
      </label>
      <label>
        キャッシュ読み出し単価
        <input id="cost-cache" type="number" min="0" step="0.0001" placeholder="例: 0.3" />
      </label>
    </div>

    <h3>操作</h3>
    <label><input type="radio" name="action" value="create" checked /> 追加</label>
    <label><input type="radio" name="action" value="update" /> 更新</label>

    <div style="margin-top:16px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
      <button id="open-issue" type="button">GitHub Issue を開く</button>
      <button id="copy-body" type="button">Issue 本文をコピー</button>
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
