# 数据浏览

<div id="loading" style="text-align: center; padding: 20px;">
  <p>正在加载数据...</p>
</div>

<div id="error" style="display: none; text-align: center; padding: 20px; color: red;">
  <p>加载数据失败，请稍后重试。</p>
</div>

<div id="data-container" style="display: none;">
  
  <!-- 统计信息 -->
  <div id="stats" style="margin-bottom: 30px;">
    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; flex: 1; min-width: 200px;">
        <h3 style="margin: 0 0 5px 0; color: #495057;">提供商数量</h3>
        <p style="margin: 0; font-size: 24px; font-weight: bold; color: #007bff;" id="provider-count">-</p>
      </div>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; flex: 1; min-width: 200px;">
        <h3 style="margin: 0 0 5px 0; color: #495057;">模型数量</h3>
        <p style="margin: 0; font-size: 24px; font-weight: bold; color: #28a745;" id="model-count">-</p>
      </div>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; flex: 1; min-width: 200px;">
        <h3 style="margin: 0 0 5px 0; color: #495057;">最后更新</h3>
        <p style="margin: 0; font-size: 14px; color: #6c757d;" id="last-updated">-</p>
      </div>
    </div>
  </div>

  <!-- 搜索和筛选 -->
  <div style="margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
    <input type="text" id="search-input" placeholder="搜索提供商或模型..." 
           style="flex: 1; min-width: 300px; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px;">
    <select id="provider-filter" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px;">
      <option value="">所有提供商</option>
    </select>
    <label style="display: flex; align-items: center; gap: 5px;">
      <input type="checkbox" id="has-pricing"> 仅显示有定价信息的模型
    </label>
  </div>

  <!-- 提供商列表 -->
  <div id="providers-list">
  </div>

</div>

<script>
let allData = {};
let filteredData = {};

// 获取正确的 API 基础路径
function getApiBasePath() {
  // 检测是否在 GitHub Pages 部署环境
  if (window.location.hostname === 'basellm.github.io') {
    return '/llm-metadata/api';
  }
  
  // 本地开发环境
  return './api';
}

// 加载数据
async function loadData() {
  try {
    const apiBasePath = getApiBasePath();
    const [indexResponse, manifestResponse] = await Promise.all([
      fetch(`${apiBasePath}/index.json`),
      fetch(`${apiBasePath}/manifest.json`)
    ]);
    
    const indexData = await indexResponse.json();
    const manifestData = await manifestResponse.json();
    
    // 加载完整数据
    const allResponse = await fetch(`${apiBasePath}/all.json`);
    const allModelsData = await allResponse.json();
    
    allData = {
      index: indexData,
      manifest: manifestData,
      models: allModelsData
    };
    
    showData();
  } catch (error) {
    console.error('Failed to load data:', error);
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
  }
}

// 显示数据
function showData() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('data-container').style.display = 'block';
  
  // 更新统计信息
  const stats = allData.manifest.stats;
  document.getElementById('provider-count').textContent = stats.providers;
  document.getElementById('model-count').textContent = stats.models;
  document.getElementById('last-updated').textContent = new Date(allData.manifest.generatedAt).toLocaleString('zh-CN');
  
  // 填充提供商筛选器
  const providerFilter = document.getElementById('provider-filter');
  allData.index.providers.forEach(provider => {
    const option = document.createElement('option');
    option.value = provider.id;
    option.textContent = `${provider.name} (${provider.modelCount})`;
    providerFilter.appendChild(option);
  });
  
  // 初始显示所有数据
  filterAndDisplayData();
  
  // 绑定事件监听器
  document.getElementById('search-input').addEventListener('input', filterAndDisplayData);
  document.getElementById('provider-filter').addEventListener('change', filterAndDisplayData);
  document.getElementById('has-pricing').addEventListener('change', filterAndDisplayData);
}

// 筛选和显示数据
function filterAndDisplayData() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  const selectedProvider = document.getElementById('provider-filter').value;
  const hasPricing = document.getElementById('has-pricing').checked;
  
  const providersContainer = document.getElementById('providers-list');
  providersContainer.innerHTML = '';
  
  // 筛选提供商
  const filteredProviders = allData.index.providers.filter(provider => {
    if (selectedProvider && provider.id !== selectedProvider) return false;
    if (searchTerm && !provider.name.toLowerCase().includes(searchTerm) && !provider.id.toLowerCase().includes(searchTerm)) return false;
    return true;
  });
  
  filteredProviders.forEach(provider => {
    const providerData = allData.models[provider.id];
    if (!providerData || !providerData.models) return;
    
    // 筛选模型
    const models = Object.entries(providerData.models).filter(([modelId, model]) => {
      if (searchTerm && !model.name.toLowerCase().includes(searchTerm) && !modelId.toLowerCase().includes(searchTerm)) return false;
      if (hasPricing && (!model.cost || !model.cost.input)) return false;
      return true;
    });
    
    if (models.length === 0) return;
    
    // 创建提供商卡片
    const providerCard = createProviderCard(provider, providerData, models);
    providersContainer.appendChild(providerCard);
  });
  
  if (filteredProviders.length === 0) {
    providersContainer.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 40px;">没有找到匹配的数据</p>';
  }
}

// 创建提供商卡片
function createProviderCard(provider, providerData, models) {
  const card = document.createElement('div');
  card.style.cssText = 'border: 1px solid #ddd; border-radius: 8px; margin-bottom: 20px; overflow: hidden; background: white;';
  
  const header = document.createElement('div');
  header.style.cssText = 'background: #f8f9fa; padding: 15px; border-bottom: 1px solid #ddd;';
  
  const title = document.createElement('h3');
  title.style.cssText = 'margin: 0; color: #333;';
  title.innerHTML = `${provider.name} <span style="color: #6c757d; font-size: 14px; font-weight: normal;">(${models.length} 个模型)</span>`;
  
  const links = document.createElement('div');
  links.style.cssText = 'margin-top: 8px;';
  if (providerData.api) {
    links.innerHTML += `<a href="${providerData.api}" target="_blank" style="margin-right: 15px; color: #007bff; text-decoration: none;">API 文档</a>`;
  }
  if (providerData.doc) {
    links.innerHTML += `<a href="${providerData.doc}" target="_blank" style="color: #007bff; text-decoration: none;">官方文档</a>`;
  }
  
  header.appendChild(title);
  header.appendChild(links);
  
  const body = document.createElement('div');
  body.style.cssText = 'padding: 15px;';
  
  // 创建模型表格
  const table = createModelsTable(models);
  body.appendChild(table);
  
  card.appendChild(header);
  card.appendChild(body);
  
  return card;
}

// 创建模型表格
function createModelsTable(models) {
  const table = document.createElement('table');
  table.style.cssText = 'width: 100%; border-collapse: collapse; font-size: 14px;';
  
  // 表头
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr style="background: #f8f9fa;">
      <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">模型名称</th>
      <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">描述</th>
      <th style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd;">定价</th>
      <th style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd;">能力</th>
    </tr>
  `;
  
  // 表体
  const tbody = document.createElement('tbody');
  models.forEach(([modelId, model]) => {
    const row = document.createElement('tr');
    row.style.cssText = 'border-bottom: 1px solid #f1f1f1;';
    
    // 模型名称
    const nameCell = document.createElement('td');
    nameCell.style.cssText = 'padding: 8px; font-weight: 600;';
    nameCell.textContent = model.name || modelId;
    
    // 描述
    const descCell = document.createElement('td');
    descCell.style.cssText = 'padding: 8px; max-width: 300px; word-wrap: break-word;';
    descCell.textContent = model.description || '-';
    
    // 定价
    const priceCell = document.createElement('td');
    priceCell.style.cssText = 'padding: 8px; text-align: center; font-family: monospace;';
    if (model.cost && model.cost.input) {
      priceCell.innerHTML = `
        <div style="font-size: 12px;">
          <div>输入: $${model.cost.input}/1M</div>
          <div>输出: $${model.cost.output || '-'}/1M</div>
        </div>
      `;
    } else {
      priceCell.textContent = '-';
    }
    
    // 能力
    const capabilityCell = document.createElement('td');
    capabilityCell.style.cssText = 'padding: 8px; text-align: center;';
    const capabilities = [];
    if (model.attachment) capabilities.push('📎');
    if (model.reasoning) capabilities.push('🧠');
    if (model.tool_call) capabilities.push('🔧');
    capabilityCell.innerHTML = capabilities.length > 0 ? capabilities.join(' ') : '-';
    
    row.appendChild(nameCell);
    row.appendChild(descCell);
    row.appendChild(priceCell);
    row.appendChild(capabilityCell);
    
    tbody.appendChild(row);
  });
  
  table.appendChild(thead);
  table.appendChild(tbody);
  
  return table;
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', loadData);
</script>

<style>
/* 响应式样式 */
@media (max-width: 768px) {
  table {
    font-size: 12px !important;
  }
  
  th, td {
    padding: 4px !important;
  }
  
  .stats-container > div {
    min-width: 150px !important;
  }
}
</style>
