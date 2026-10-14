import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('TUKUBI Shorts Creation & Creator Studio Integration', () => {
  const rootDir = join(__dirname, '../..');
  const createModalPath = join(rootDir, 'apps/web/src/components/shorts/create-short-modal.tsx');
  const studioVideosPagePath = join(rootDir, 'apps/web/src/app/creator-studio/videos/page.tsx');
  const createHubClientPath = join(rootDir, 'apps/web/src/components/create-hub-client.tsx');

  it('verifies CreateShortModal exists and implements multi-identity publishing and camera handoff', () => {
    expect(existsSync(createModalPath)).toBe(true);
    const content = readFileSync(createModalPath, 'utf-8');
    // Multi-identity publishing (personal vs Page)
    expect(content).toContain('fetchUserManagedPagesAction');
    expect(content).toContain('selectedIdentity');
    expect(content).toContain('pageId');
    // 9:16 Camera Studio handoff
    expect(content).toContain('TukubiCreationStudio');
    expect(content).toContain('handleCameraHandoff');
    // Caribbean sounds integration
    expect(content).toContain('CARIBBEAN_SOUNDS');
    // Category chips
    expect(content).toContain('Carnival & Heritage');
    expect(content).toContain('Soca & Reggae');
  });

  it('verifies CreatorStudioVideosPage includes Shorts filter and Page-owned video listing', () => {
    expect(existsSync(studioVideosPagePath)).toBe(true);
    const content = readFileSync(studioVideosPagePath, 'utf-8');
    expect(content).toContain('/shorts?create=true');
    expect(content).toContain('page_roles');
    expect(content).toContain('currentKind');
    expect(content).toContain('/shorts?id=');
  });

  it('verifies CreateHubClient includes dedicated TUKUBI Shorts tool card', () => {
    expect(existsSync(createHubClientPath)).toBe(true);
    const content = readFileSync(createHubClientPath, 'utf-8');
    expect(content).toContain("id: 'shorts'");
    expect(content).toContain("directHref: '/shorts?create=true'");
    expect(content).toContain("title: 'TUKUBI Shorts'");
  });
});
