import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('TUKUBI Shorts Cross-Device Navigation', () => {
  const rootDir = join(__dirname, '../..');
  const sidebarPath = join(rootDir, 'apps/web/src/components/app-sidebar.tsx');
  const mobileNavPath = join(rootDir, 'apps/web/src/components/mobile-nav.tsx');
  const appShellPath = join(rootDir, 'apps/web/src/components/app-shell.tsx');
  const nativeBottomNavPath = join(rootDir, 'apps/mobile/src/components/BottomNav.tsx');
  const nativeAppPath = join(rootDir, 'apps/mobile/App.tsx');

  it('Desktop sidebar includes prominent Shorts entry', () => {
    expect(existsSync(sidebarPath)).toBe(true);
    const content = readFileSync(sidebarPath, 'utf-8');
    expect(content).toContain("href: '/shorts'");
    expect(content).toContain('Shorts');
  });

  it('Mobile web navigation includes Shorts with accessible touch targets', () => {
    expect(existsSync(mobileNavPath)).toBe(true);
    const content = readFileSync(mobileNavPath, 'utf-8');
    expect(content).toContain('href="/shorts"');
    expect(content).toContain('aria-label="TUKUBI Shorts"');
    expect(content).toContain('min-w-[44px]');
    expect(content).toContain('min-h-[44px]');
  });

  it('AppShell handles Shorts route without nested scroll or breaking padding', () => {
    expect(existsSync(appShellPath)).toBe(true);
    const content = readFileSync(appShellPath, 'utf-8');
    expect(content).toContain('isShortsRoute');
  });

  it('Native mobile BottomNav includes Shorts tab', () => {
    expect(existsSync(nativeBottomNavPath)).toBe(true);
    const content = readFileSync(nativeBottomNavPath, 'utf-8');
    expect(content).toContain("'shorts'");
    expect(content).toContain('Shorts');
  });

  it('Native mobile App.tsx registers Shorts deep linking', () => {
    expect(existsSync(nativeAppPath)).toBe(true);
    const content = readFileSync(nativeAppPath, 'utf-8');
    expect(content).toContain("Shorts: 'shorts'");
  });
});
