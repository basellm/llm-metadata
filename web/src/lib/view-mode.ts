/** 模型列表视图偏好：默认卡片，持久化方式与主题、语言一致 */

export type ViewMode = 'table' | 'cards';

const STORAGE_KEY = 'llm-metadata.view';

/** 仅在用户明确选择过表格时返回 table；未存储、值非法或存储不可用时均为默认卡片 */
export function readStoredViewMode(): ViewMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'table' ? 'table' : 'cards';
  } catch {
    return 'cards';
  }
}

export function storeViewMode(mode: ViewMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // 存储不可用时仅在当前会话生效
  }
}
