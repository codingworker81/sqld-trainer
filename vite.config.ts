import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const base = '/sqld-trainer/';
const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'));

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      // We register the service worker ourselves via the React hook
      // (UpdatePrompt), so the plugin shouldn't inject its own script.
      injectRegister: false,
      manifest: {
        name: 'SQLD 2과목 암기',
        short_name: 'SQLD암기',
        description: 'SQLD 2과목 SQL 문법을 간격 반복으로 암기하는 개인용 학습 앱',
        lang: 'ko',
        id: base,
        display: 'standalone',
        start_url: base,
        scope: base,
        theme_color: '#0f172a',
        background_color: '#0f172a',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Stage 8 재검증(docs/decisions.md #8): 카드 JSON·요약 MD는
        // import.meta.glob({ eager: true })로 index-*.js에 정적으로
        // 인라인되어 별도 .json/.md 파일로 나오지 않으므로(dist 확인됨),
        // 그 확장자는 globPatterns에 둘 필요가 없다 — 앱 셸(index.js 등)이
        // 사전 캐시되면 콘텐츠도 함께 캐시된다.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // e2e/*.spec.ts는 Playwright 전용(Stage 8)이라 Vitest의 기본
    // *.spec.ts 패턴에 걸려 같이 실행되지 않도록 제외한다.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/engine/**/*.ts'],
      exclude: ['src/engine/**/*.test.ts'],
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 90,
        branches: 80,
      },
    },
  },
});
