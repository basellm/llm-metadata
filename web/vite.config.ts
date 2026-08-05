import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// 站点部署在子路径（GitHub Pages）与根路径（Cloudflare Pages），
// base 使用相对路径以同时兼容两者；产物输出到仓库 dist/（与静态 API 同根）。
// dev 模式以 ../dist 为静态目录，使 /api/* 数据可用（需先在根目录 npm run build）。
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  base: './',
  publicDir: command === 'serve' ? '../dist' : false,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: false,
    assetsDir: 'app',
  },
}));
