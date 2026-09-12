import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Dedicated Studios Architecture (Creator Studio & Business Studio)', () => {
  const rootDir = path.resolve(__dirname, '../..');

  it('verifies Creator Studio package and pages existence', () => {
    const pkgPath = path.join(rootDir, 'apps/creator-studio/package.json');
    expect(fs.existsSync(pkgPath)).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    expect(pkg.name).toBe('caribbean-creator-studio');
    expect(pkg.dependencies['@caribbean/creator']).toBe('workspace:*');
    expect(pkg.dependencies['@caribbean/media']).toBe('workspace:*');
    expect(pkg.dependencies['@caribbean/jobs']).toBe('workspace:*');

    expect(fs.existsSync(path.join(rootDir, 'apps/creator-studio/src/app/page.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'apps/creator-studio/src/app/analytics/page.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'apps/creator-studio/src/app/vault/page.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'apps/creator-studio/src/app/schedule/page.tsx'))).toBe(true);
  });

  it('verifies Business Studio package and pages existence', () => {
    const pkgPath = path.join(rootDir, 'apps/business-studio/package.json');
    expect(fs.existsSync(pkgPath)).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    expect(pkg.name).toBe('caribbean-business-studio');
    expect(pkg.dependencies['@caribbean/business']).toBe('workspace:*');
    expect(pkg.dependencies['@caribbean/advertising']).toBe('workspace:*');
    expect(pkg.dependencies['@caribbean/jobs']).toBe('workspace:*');

    expect(fs.existsSync(path.join(rootDir, 'apps/business-studio/src/app/page.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'apps/business-studio/src/app/orders/page.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'apps/business-studio/src/app/campaigns/page.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'apps/business-studio/src/app/team/page.tsx'))).toBe(true);
  });
});
