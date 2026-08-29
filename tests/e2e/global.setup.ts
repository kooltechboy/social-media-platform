import { test as setup } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Ensure the destination directory exists
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Set up the authenticated storage state for E2E tests
  const storageState = {
    cookies: [],
    origins: [
      {
        origin: 'http://localhost:3100',
        localStorage: [
          {
            name: 'caribbean_one_user_session',
            value: JSON.stringify({
              id: 'usr_playwright_test_01',
              email: 'testuser@caribbeanone.app',
              username: 'caribbean_tester',
              displayName: 'Antilia Tester',
              role: 'user',
            }),
          },
        ],
      },
    ],
  };

  fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2), 'utf-8');
});
