import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/browser',
  timeout: 30_000,
  fullyParallel: true,
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'E2E_BROWSER_TEST=true VITE_E2E_BROWSER_TEST=true PORT=4173 npm run dev',
    url: 'http://127.0.0.1:4173/api/health',
    // The E2E build toggles a test-only auth/persistence harness; never reuse
    // a server started without that environment.
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
