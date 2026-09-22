import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 1 Launch Blockers Verification Suite', () => {
  const rootDir = path.resolve(__dirname, '../..');

  it('S0-1: /communities/create page exists and exports a valid React component', () => {
    const filePath = path.join(rootDir, 'apps/web/src/app/communities/create/page.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('export default function CreateCommunityPage');
    expect(content).toContain('createCommunityAction');
    expect(content).toContain('joinPolicy');
  });

  it('S0-2: /embed is included in GATEWAY_ROUTES in app-shell.tsx', () => {
    const filePath = path.join(rootDir, 'apps/web/src/components/app-shell.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/GATEWAY_ROUTES\s*=\s*\[[\s\S]*?'\/embed'[\s\S]*?\]/);
  });

  it('S0-3: /home/page.tsx cleanly redirects to canonical /', () => {
    const filePath = path.join(rootDir, 'apps/web/src/app/home/page.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain("redirect('/')");
    expect(content).not.toContain('buildRankedFeed');
  });

  it('S0-4: not-found.tsx exists at root app directory with branded 404 UI', () => {
    const filePath = path.join(rootDir, 'apps/web/src/app/not-found.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('export default function NotFound');
    expect(content).toContain('Lost in the Archipelago');
    expect(content).toContain('Error 404');
  });

  it('S1-1: /explore/diaspora/page.tsx redirects to /diaspora and explore-rail links to /diaspora', () => {
    const redirectPath = path.join(rootDir, 'apps/web/src/app/explore/diaspora/page.tsx');
    expect(fs.existsSync(redirectPath)).toBe(true);
    const redirectContent = fs.readFileSync(redirectPath, 'utf-8');
    expect(redirectContent).toContain("redirect('/diaspora')");

    const railPath = path.join(rootDir, 'apps/web/src/components/rails/explore-rail.tsx');
    const railContent = fs.readFileSync(railPath, 'utf-8');
    expect(railContent).toContain('href="/diaspora"');
  });

  it('S1-2: /ads is linked from CreatorStudioRail and AppSidebar', () => {
    const railPath = path.join(rootDir, 'apps/web/src/components/rails/creator-studio-rail.tsx');
    const railContent = fs.readFileSync(railPath, 'utf-8');
    expect(railContent).toContain("href: '/ads'");

    const sidebarPath = path.join(rootDir, 'apps/web/src/components/app-sidebar.tsx');
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
    expect(sidebarContent).toContain("href: '/ads'");
  });

  it('S1-3: /moderation/signup cleanly redirects to /moderator/signup avoiding double footer', () => {
    const filePath = path.join(rootDir, 'apps/web/src/app/moderation/signup/page.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain("redirect('/moderator/signup')");
  });

  it('S1-5 & S1-6: Orphaned proxy/dead components are eradicated', () => {
    const deadFiles = [
      'apps/web/src/components/media/device-media-capture-modal.tsx',
      'apps/web/src/components/post-composer.tsx',
      'apps/web/src/components/profile-edit-form.tsx',
      'apps/web/src/components/moments/moment-viewer-modal.tsx',
    ];

    for (const file of deadFiles) {
      const fullPath = path.join(rootDir, file);
      expect(fs.existsSync(fullPath)).toBe(false);
    }
  });

  it('UniversalComposer directly imports TukubiCameraModal rather than proxy', () => {
    const composerPath = path.join(rootDir, 'apps/web/src/components/universal-composer.tsx');
    const composerContent = fs.readFileSync(composerPath, 'utf-8');
    expect(composerContent).toContain("from './media/tukubi-camera-modal'");
    expect(composerContent).not.toContain('device-media-capture-modal');
  });
});
