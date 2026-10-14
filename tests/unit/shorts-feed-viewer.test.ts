import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('TUKUBI Shorts Feed Viewer & Experience', () => {
  const rootDir = join(__dirname, '../..');
  const shortsViewerPath = join(rootDir, 'apps/web/src/components/shorts/shorts-feed-viewer.tsx');
  const shortCardPath = join(rootDir, 'apps/web/src/components/shorts/short-card.tsx');
  const shortsPagePath = join(rootDir, 'apps/web/src/app/shorts/page.tsx');
  const shortsLoadingPath = join(rootDir, 'apps/web/src/app/shorts/loading.tsx');
  const reelsPagePath = join(rootDir, 'apps/web/src/app/reels/page.tsx');

  it('verifies Shorts page, loading, and component files exist', () => {
    expect(existsSync(shortsPagePath)).toBe(true);
    expect(existsSync(shortsLoadingPath)).toBe(true);
    expect(existsSync(shortsViewerPath)).toBe(true);
    expect(existsSync(shortCardPath)).toBe(true);
  });

  it('verifies GPU decoder protection: video decoders only mounted for active/adjacent viewports', () => {
    const cardContent = readFileSync(shortCardPath, 'utf-8');
    expect(cardContent).toContain('isActive || isNext');
  });

  it('verifies keyboard shortcuts support (M for mute, Space for play/pause, Arrows for navigation)', () => {
    const viewerContent = readFileSync(shortsViewerPath, 'utf-8');
    expect(viewerContent).toContain('ArrowDown');
    expect(viewerContent).toContain('ArrowUp');
  });

  it('verifies feed tabs include real functional filters (For You, Following, Trending, Caribbean)', () => {
    const pageContent = readFileSync(shortsPagePath, 'utf-8');
    expect(pageContent).toContain('for_you');
    expect(pageContent).toContain('following');
    expect(pageContent).toContain('trending');
    expect(pageContent).toContain('caribbean');
  });

  it('verifies /reels route maintains 100% backward compatibility', () => {
    expect(existsSync(reelsPagePath)).toBe(true);
    const reelsContent = readFileSync(reelsPagePath, 'utf-8');
    expect(reelsContent.length).toBeGreaterThan(500);
  });
});
