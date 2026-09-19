#!/usr/bin/env node
/**
 * 模型描述翻译记忆维护脚本（npm run translate）。
 *
 * 构建本身离线且确定：只读取 i18n/descriptions/<locale>.json。本脚本负责让该文件
 * 与当前目录保持同步：为缺失译文的英文描述调用 OpenAI 兼容的 Chat Completions
 * 接口生成译文，并移除目录中已不存在的原文条目。
 *
 * 环境变量：TRANSLATE_API_KEY（必填，--dry-run 除外）、TRANSLATE_BASE_URL
 * （默认 https://api.openai.com/v1）、TRANSLATE_MODEL（默认 gpt-4o-mini）。
 * 参数：--locale <id> 仅处理某语言；--dry-run 只列出缺失数量，不请求也不写入。
 */
export {};
//# sourceMappingURL=translate.d.ts.map