import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./apps/web/src', import.meta.url)),
    },
  },
  test: {
    include: ['tests/unit/**/*.test.ts', 'packages/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    testTimeout: 15000,
  },
});
