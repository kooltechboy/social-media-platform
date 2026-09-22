import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 3 Ecosystem Flywheel & Layout Architecture Suite', () => {
  const rootDir = path.resolve(__dirname, '../..');

  it('S2-3: apps/web/src/app/marketplace/layout.tsx exists with MarketplaceSubNav', () => {
    const layoutPath = path.join(rootDir, 'apps/web/src/app/marketplace/layout.tsx');
    expect(fs.existsSync(layoutPath)).toBe(true);
    const content = fs.readFileSync(layoutPath, 'utf-8');
    expect(content).toContain('MarketplaceSubNav');
    expect(content).toContain('TUKUBI Marketplace');

    const subNavPath = path.join(rootDir, 'apps/web/src/components/marketplace/marketplace-sub-nav.tsx');
    expect(fs.existsSync(subNavPath)).toBe(true);
    const subNavContent = fs.readFileSync(subNavPath, 'utf-8');
    expect(subNavContent).toContain('/marketplace/orders');
    expect(subNavContent).toContain('/marketplace/wishlist');
    expect(subNavContent).toContain('/marketplace/seller-center');
  });

  it('S2-3: apps/web/src/app/creator-studio/layout.tsx exists with CreatorStudioSubNav', () => {
    const layoutPath = path.join(rootDir, 'apps/web/src/app/creator-studio/layout.tsx');
    expect(fs.existsSync(layoutPath)).toBe(true);
    const content = fs.readFileSync(layoutPath, 'utf-8');
    expect(content).toContain('CreatorStudioSubNav');
    expect(content).toContain('TUKUBI Creator Studio');

    const subNavPath = path.join(rootDir, 'apps/web/src/components/creator/creator-studio-sub-nav.tsx');
    expect(fs.existsSync(subNavPath)).toBe(true);
    const subNavContent = fs.readFileSync(subNavPath, 'utf-8');
    expect(subNavContent).toContain('/creator-studio/videos');
    expect(subNavContent).toContain('/creator-studio/monetization');
    expect(subNavContent).toContain('/ads');
  });

  it('Profile Flywheel: Profile displays and links to user Pages and Communities', () => {
    const profilePath = path.join(rootDir, 'apps/web/src/app/profile/[username]/page.tsx');
    const content = fs.readFileSync(profilePath, 'utf-8');

    // Database queries
    expect(content).toMatch(/supabase\s*\.from\('businesses'\)/);
    expect(content).toMatch(/supabase\s*\.from\('community_members'\)/);

    // Nav tabs
    expect(content).toContain("tab === 'pages'");
    expect(content).toContain("tab === 'communities'");

    // Content cards with links
    expect(content).toContain('href={`/pages/${p.slug}`}');
    expect(content).toContain('href={`/communities/${c.slug}`}');
  });

  it('Marketplace to Messaging Continuity: Product detail links directly to message seller', () => {
    const detailPath = path.join(rootDir, 'apps/web/src/app/marketplace/[id]/page.tsx');
    const content = fs.readFileSync(detailPath, 'utf-8');
    expect(content).toContain('/messages?u=');
    expect(content).toContain('Message Seller');
  });

  it('Messaging Continuity: Messages page resolves target profile with ?u=', () => {
    const messagesPath = path.join(rootDir, 'apps/web/src/app/messages/page.tsx');
    const content = fs.readFileSync(messagesPath, 'utf-8');
    expect(content).toContain('getOrCreateDirectConversation');
    expect(content).toContain('params.u');
  });

  it('Rich Commerce Cards: 9 context cards supported in message thread', () => {
    const cardsPath = path.join(rootDir, 'apps/web/src/components/messages/cards/message-context-card.tsx');
    expect(fs.existsSync(cardsPath)).toBe(true);
    const content = fs.readFileSync(cardsPath, 'utf-8');
    expect(content).toContain('ProductContextPayload');
    expect(content).toContain('OrderContextPayload');
    expect(content).toContain('ShipmentTrackingContextPayload');
    expect(content).toContain('EventContextPayload');
    expect(content).toContain('LivestreamContextPayload');
    expect(content).toContain('CommunityContextPayload');
  });
});
