import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, unlinkSync, writeFileSync, } from 'node:fs';
import path, { extname, join } from 'node:path';
import { stableStringify } from './object-utils.js';
/** 文件系统工具函数 */
/** 确保目录存在 */
export function ensureDirSync(dirPath) {
    if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
    }
}
/** 复制目录（如果存在） */
export function copyDirSyncIfExists(srcDir, destDir) {
    if (!existsSync(srcDir))
        return;
    ensureDirSync(destDir);
    const items = readdirSync(srcDir);
    for (const item of items) {
        const srcPath = join(srcDir, item);
        const destPath = join(destDir, item);
        const stat = statSync(srcPath);
        if (stat.isDirectory()) {
            copyDirSyncIfExists(srcPath, destPath);
        }
        else {
            const content = readFileSync(srcPath);
            writeFileSync(destPath, content);
        }
    }
}
/** 移除非 JSON 文件 */
export function removeNonJsonFiles(dirPath, options = {}) {
    if (!existsSync(dirPath))
        return;
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
export function sanitizeFileSegment(segment) {
    return segment.replace(/[^a-zA-Z0-9\-_.]/g, '_');
}
/** 删除目录中不在保留清单内的 .json 文件（按不含扩展名的文件名匹配），返回删除数量 */
export function pruneJsonFiles(dirPath, keep, options = {}) {
    if (!existsSync(dirPath))
        return 0;
    let removed = 0;
    for (const item of readdirSync(dirPath)) {
        const itemPath = join(dirPath, item);
        if (!statSync(itemPath).isFile() || extname(item) !== '.json')
            continue;
        if (keep.has(item.slice(0, -'.json'.length)))
            continue;
        if (!options.dryRun) {
            unlinkSync(itemPath);
        }
        removed++;
    }
    return removed;
}
/** 删除目录中不在保留清单内的子目录（递归删除），返回删除数量 */
export function pruneSubdirectories(dirPath, keep, options = {}) {
    if (!existsSync(dirPath))
        return 0;
    let removed = 0;
    for (const item of readdirSync(dirPath)) {
        const itemPath = join(dirPath, item);
        if (!statSync(itemPath).isDirectory() || keep.has(item))
            continue;
        if (!options.dryRun) {
            rmSync(itemPath, { recursive: true, force: true });
        }
        removed++;
    }
    return removed;
}
/** 检查文件内容是否发生变化并写入 */
export function writeJSONIfChanged(filePath, data, options = {}) {
    const newContent = stableStringify(data);
    let existingContent = '';
    if (existsSync(filePath)) {
        try {
            existingContent = readFileSync(filePath, 'utf8');
        }
        catch (error) {
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
/** 读取 JSON 文件（如果存在） */
export function readJSONIfExists(filePath) {
    try {
        if (!existsSync(filePath))
            return null;
        const content = readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    }
    catch (error) {
        return null;
    }
}
//# sourceMappingURL=file-utils.js.map