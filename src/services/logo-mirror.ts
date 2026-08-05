import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Provider } from '../types/index.js';
import { ensureDirSync, pruneFiles, sanitizeFileSegment } from '../utils/file-utils.js';

const FETCH_TIMEOUT_MS = 10_000;
const FETCH_CONCURRENCY = 6;

export interface LogoMirrorResult {
  changes: number;
  warnings: string[];
}

/**
 * 供应商 logo 镜像服务。
 *
 * 将各供应商 iconURL 指向的 SVG 下载到本地缓存并复制到
 * dist/api/logos/<id>.svg，使 Web UI 以同源地址加载图标，
 * 摆脱对 models.dev 等第三方主机可达性的依赖。
 * 下载失败时保留既有缓存副本并给出警告；--check 模式不发起网络请求。
 */
export async function mirrorProviderLogos(
  providers: Record<string, Provider>,
  dirs: { cacheDir: string; outDir: string },
  options: { dryRun?: boolean; force?: boolean } = {},
): Promise<LogoMirrorResult> {
  const warnings: string[] = [];

  const entries = Object.entries(providers)
    .filter(([, provider]) => /^https?:\/\//.test(provider.iconURL || ''))
    .map(([providerId, provider]) => ({
      safeId: sanitizeFileSegment(providerId),
      url: provider.iconURL!,
    }));

  const keep = new Set(entries.map((entry) => entry.safeId));
  let changes = pruneFiles(dirs.outDir, keep, '.svg', options);

  // check 模式只统计清理量，不做网络请求（保持离线可用与速度）
  if (options.dryRun) {
    return { changes, warnings };
  }

  ensureDirSync(dirs.cacheDir);
  ensureDirSync(dirs.outDir);

  const fetchLogo = async (entry: { safeId: string; url: string }): Promise<void> => {
    const cachePath = join(dirs.cacheDir, `${entry.safeId}.svg`);

    if (options.force || !existsSync(cachePath)) {
      try {
        const response = await fetch(entry.url, {
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          redirect: 'follow',
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const body = await response.text();
        if (!body.includes('<svg')) throw new Error('response is not an SVG');
        writeFileSync(cachePath, body, 'utf8');
      } catch (error) {
        warnings.push(
          `logo: failed to fetch ${entry.url} (${error instanceof Error ? error.message : String(error)})`,
        );
      }
    }

    if (!existsSync(cachePath)) return;

    const outPath = join(dirs.outDir, `${entry.safeId}.svg`);
    const content = readFileSync(cachePath, 'utf8');
    const existing = existsSync(outPath) ? readFileSync(outPath, 'utf8') : null;
    if (content !== existing) {
      writeFileSync(outPath, content, 'utf8');
      changes++;
    }
  };

  // 有限并发下载，避免对上游造成瞬时压力
  const queue = [...entries];
  const workers = Array.from({ length: Math.min(FETCH_CONCURRENCY, queue.length) }, async () => {
    for (let entry = queue.shift(); entry; entry = queue.shift()) {
      await fetchLogo(entry);
    }
  });
  await Promise.all(workers);

  return { changes, warnings };
}
