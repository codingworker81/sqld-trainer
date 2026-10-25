import { defineConfig, devices } from '@playwright/test';

/**
 * Stage 8 스모크 테스트: dist 빌드 결과물을 vite preview로 띄워 실제
 * 배포에 가까운 번들(서비스 워커·콘텐츠 사전 캐시 포함)로 검증한다.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/sqld-trainer/',
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'mobile-375x812',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 812 },
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'pc-1280x800',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
});
