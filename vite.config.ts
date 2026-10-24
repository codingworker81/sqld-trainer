/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const base = '/sqld-trainer/';

export default defineConfig({
  base,
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
        // Pre-cache the app shell plus content that doesn't exist yet
        // (Stage 3/7 cards and summaries) so later stages don't need to
        // revisit this config (docs/decisions.md #8).
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,json,md}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
});
