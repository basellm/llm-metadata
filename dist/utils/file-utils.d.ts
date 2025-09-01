/** 文件系统工具函数 */
/** 确保目录存在 */
export declare function ensureDirSync(dirPath: string): void;
/** 复制目录（如果存在） */
export declare function copyDirSyncIfExists(srcDir: string, destDir: string): void;
/** 移除非 JSON 文件 */
export declare function removeNonJsonFiles(dirPath: string, options?: {
    dryRun?: boolean;
}): void;
/** 安全的文件名段 */
export declare function sanitizeFileSegment(segment: string): string;
/** 检查文件内容是否发生变化并写入 */
export declare function writeJSONIfChanged(filePath: string, data: any, options?: {
    dryRun?: boolean;
}): boolean;
/** 检查文本内容是否发生变化并写入 */
export declare function writeTextIfChanged(filePath: string, content: string, options?: {
    dryRun?: boolean;
}): boolean;
/** 读取 JSON 文件（如果存在） */
export declare function readJSONIfExists<T>(filePath: string): T | null;
//# sourceMappingURL=file-utils.d.ts.map