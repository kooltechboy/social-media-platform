import { defineConfig } from '@playwright/test';

const pnpmBin = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3100',
  },
  webServer: {
    command: `${pnpmBin} --filter caribbean-web exec next dev -p 3100`,
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
