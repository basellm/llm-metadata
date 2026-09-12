/** 模型列表视图（表格 / 卡片）偏好，持久化方式与主题、语言一致 */

export type ViewMode = 'table' | 'cards';

const STORAGE_KEY = 'llm-metadata.view';

export function readStoredViewMode(): ViewMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'cards' ? 'cards' : 'table';
  } catch {
    return 'table';
  }
}

export function storeViewMode(mode: ViewMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // 存储不可用时仅在当前会话生效
  }
}
