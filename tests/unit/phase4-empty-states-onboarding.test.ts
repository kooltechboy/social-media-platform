import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 4: First-Time User Experience & Empty States', () => {
  const rootDir = path.resolve(__dirname, '../..');

  it('communities page has actionable empty state with create and reset buttons', () => {
    const filePath = path.join(rootDir, 'apps/web/src/app/communities/page.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('No diaspora communities found');
    expect(content).toContain('/communities/create');
    expect(content).toContain('Create Diaspora Hub');
    expect(content).toContain('Reset Filters');
  });

  it('notifications page provides friendly empty state with feed exploration CTA', () => {
    const filePath = path.join(rootDir, 'apps/web/src/app/notifications/page.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('No notifications yet');
    expect(content).toContain('Explore Caribbean Feed');
    expect(content).toContain('href="/"');
  });

  it('saved posts page provides informative empty state with discovery CTA', () => {
    const filePath = path.join(rootDir, 'apps/web/src/app/saved/page.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('No saved posts yet');
    expect(content).toContain('Discover Posts to Save');
    expect(content).toContain('href="/"');
  });

  it('messages center client contains filter-aware empty states and online member fallback', () => {
    const filePath = path.join(rootDir, 'apps/web/src/components/messages/messages-center-client.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('No conversations yet');
    expect(content).toContain('New Conversation');
    expect(content).toContain('View All Chats');
    expect(content).toContain('No members currently online');
    expect(content).toContain('Find Caribbean friends to message');
  });

  it('people hub client contains clear empty states and recovery CTAs across tabs', () => {
    const filePath = path.join(rootDir, 'apps/web/src/components/people/people-hub-client.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Discover tab empty state
    expect(content).toContain('No members found');
    expect(content).toContain('Reset Filters');

    // Friends tab empty state
    expect(content).toContain("You haven't added any friends yet");
    expect(content).toContain('Discover People');

    // Requests tab empty state
    expect(content).toMatch(/You(&apos;|')re all caught up!/);
  });

  it('social search client features rich zero-state and no-result category recovery pills', () => {
    const filePath = path.join(rootDir, 'apps/web/src/components/search/social-search-client.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Empty query state
    expect(content).toContain('Universal Caribbean Search');
    expect(content).toContain('Recommended For You');

    // No results state
    expect(content).toContain('No results found for');
    expect(content).toContain('Browse Members');
    expect(content).toContain('Diaspora Hubs');
    expect(content).toContain('Marketplace');
    expect(content).toContain('Cultural Events');
  });

  it('onboarding flow integrates language, territory, diaspora identity, and founder claim', () => {
    const filePath = path.join(rootDir, 'apps/web/src/app/onboarding/page.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('useTranslation');
    expect(content).toContain('LOCALES');
    expect(content).toContain('CARIBBEAN_TERRITORIES');
    expect(content).toContain('updateOnboardingIdentity');
    expect(content).toContain('/api/recognition/founders/claim');
    expect(content).toContain('FounderOnboardingModal');
  });
});
