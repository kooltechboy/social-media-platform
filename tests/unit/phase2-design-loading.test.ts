import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 2 Design Token Synchronization & Loading Architecture Suite', () => {
  const rootDir = path.resolve(__dirname, '../..');

  it('S1-7: apps/web/tailwind.config.js includes complete @caribbean/design-system tokens', () => {
    const configPath = path.join(rootDir, 'apps/web/tailwind.config.js');
    expect(fs.existsSync(configPath)).toBe(true);
    const content = fs.readFileSync(configPath, 'utf-8');

    // Brand colors
    expect(content).toContain('sunsetPlum');
    expect(content).toContain('oceanSurge');
    expect(content).toContain('palmGreen');
    expect(content).toContain('amberGlow');
    expect(content).toContain('dusk');
    expect(content).toContain('caribbeanSea');
    expect(content).toContain('sunriseCoral');

    // Semantic islandVibes palette
    expect(content).toContain('islandVibes:');
    expect(content).toContain('surfaceCard:');
    expect(content).toContain('surfaceGlass:');
    expect(content).toContain('borderHover:');

    // Glow shadows
    expect(content).toContain('glow-coral');
    expect(content).toContain('glow-sea');
  });

  it('S1-4: All 14 scoped loading.tsx skeletons exist and export default components', () => {
    const loadingFiles = [
      'apps/web/src/app/admin/loading.tsx',
      'apps/web/src/app/financial-center/loading.tsx',
      'apps/web/src/app/settings/loading.tsx',
      'apps/web/src/app/creator-studio/loading.tsx',
      'apps/web/src/app/creator-hub/loading.tsx',
      'apps/web/src/app/events/loading.tsx',
      'apps/web/src/app/reels/loading.tsx',
      'apps/web/src/app/live/loading.tsx',
      'apps/web/src/app/sounds/loading.tsx',
      'apps/web/src/app/podcasts/loading.tsx',
      'apps/web/src/app/notifications/loading.tsx',
      'apps/web/src/app/friends/loading.tsx',
      'apps/web/src/app/saved/loading.tsx',
      'apps/web/src/app/diaspora/loading.tsx',
      'apps/web/src/app/profile/loading.tsx',
    ];

    for (const relPath of loadingFiles) {
      const fullPath = path.join(rootDir, relPath);
      expect(fs.existsSync(fullPath), `Expected ${relPath} to exist`).toBe(true);
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content).toContain('export default function');
      expect(content).toContain('Skeleton');
    }
  });

  it('Scoped error boundaries exist for key hubs', () => {
    const errorFiles = [
      'apps/web/src/app/communities/error.tsx',
      'apps/web/src/app/explore/error.tsx',
      'apps/web/src/app/financial-center/error.tsx',
      'apps/web/src/app/creator-studio/error.tsx',
    ];

    for (const relPath of errorFiles) {
      const fullPath = path.join(rootDir, relPath);
      expect(fs.existsSync(fullPath), `Expected ${relPath} to exist`).toBe(true);
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content).toContain('export default function');
      expect(content).toContain("'use client'");
    }
  });
});
