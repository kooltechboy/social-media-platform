import { defineConfig } from '@playwright/test';

const pnpmBin = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3100',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...require('@playwright/test').devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: `${pnpmBin} --filter caribbean-web exec next dev -p 3100`,
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
