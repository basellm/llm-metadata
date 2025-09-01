import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path, { extname, join } from 'node:path';

import { stableStringify } from './object-utils.js';

/** 文件系统工具函数 */

/** 确保目录存在 */
export function ensureDirSync(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

/** 复制目录（如果存在） */
export function copyDirSyncIfExists(srcDir: string, destDir: string): void {
  if (!existsSync(srcDir)) return;

  ensureDirSync(destDir);

  const items = readdirSync(srcDir);
  for (const item of items) {
    const srcPath = join(srcDir, item);
    const destPath = join(destDir, item);
    const stat = statSync(srcPath);

    if (stat.isDirectory()) {
      copyDirSyncIfExists(srcPath, destPath);
    } else {
      const content = readFileSync(srcPath);
      writeFileSync(destPath, content);
    }
  }
}

/** 移除非 JSON 文件 */
export function removeNonJsonFiles(dirPath: string, options: { dryRun?: boolean } = {}): void {
  if (!existsSync(dirPath)) return;

  const items = readdirSync(dirPath);
  for (const item of items) {
    const itemPath = join(dirPath, item);
    const stat = statSync(itemPath);

    if (stat.isFile() && extname(item) !== '.json') {
      if (!options.dryRun) {
        unlinkSync(itemPath);
      }
    }
  }
}

/** 安全的文件名段 */
export function sanitizeFileSegment(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9\-_.]/g, '_');
}

/** 检查文件内容是否发生变化并写入 */
export function writeJSONIfChanged(
  filePath: string,
  data: any,
  options: { dryRun?: boolean } = {},
): boolean {
  const newContent = stableStringify(data);

  let existingContent = '';
  if (existsSync(filePath)) {
    try {
      existingContent = readFileSync(filePath, 'utf8');
    } catch (error) {
      // 读取失败，视为需要写入
    }
  }

  if (newContent === existingContent) {
    return false; // 无变化
  }

  if (!options.dryRun) {
    ensureDirSync(path.dirname(filePath));
    writeFileSync(filePath, newContent, 'utf8');
  }

  return true; // 有变化
}

/** 检查文本内容是否发生变化并写入 */
export function writeTextIfChanged(
  filePath: string,
  content: string,
  options: { dryRun?: boolean } = {},
): boolean {
  let existingContent = '';
  if (existsSync(filePath)) {
    try {
      existingContent = readFileSync(filePath, 'utf8');
    } catch (error) {
      // 读取失败，视为需要写入
    }
  }

  if (content === existingContent) {
    return false; // 无变化
  }

  if (!options.dryRun) {
    ensureDirSync(path.dirname(filePath));
    writeFileSync(filePath, content, 'utf8');
  }

  return true; // 有变化
}

/** 读取 JSON 文件（如果存在） */
export function readJSONIfExists<T>(filePath: string): T | null {
  try {
    if (!existsSync(filePath)) return null;
    const content = readFileSync(filePath, 'utf8');
    return JSON.parse(content) as T;
  } catch (error) {
    return null;
  }
}
