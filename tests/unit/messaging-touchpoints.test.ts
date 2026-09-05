import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

describe('Messaging Touchpoints — Web Discovery Components', () => {
  const webRoot = join(__dirname, '../../apps/web/src/components');

  describe('members-directory-client.tsx', () => {
    const source = readFileSync(join(webRoot, 'members/members-directory-client.tsx'), 'utf-8');

    it('renders a Message link button for non-self members', () => {
      expect(source).toContain('Message');
      // Must link to /messages?u=
      expect(source).toContain('/messages?u=');
    });

    it('uses MessageSquare icon in member cards', () => {
      expect(source).toContain('MessageSquare');
    });
  });

  describe('social-search-client.tsx', () => {
    const source = readFileSync(join(webRoot, 'search/social-search-client.tsx'), 'utf-8');

    it('renders a Message action for person/people search results', () => {
      expect(source).toContain('Message');
      expect(source).toContain('/messages?u=');
    });

    it('renders a Message action for creator search results', () => {
      // Creator cards should also have message button
      expect(source).toContain('MessageSquare');
    });
  });

  describe('friends-center-client.tsx', () => {
    const source = readFileSync(join(webRoot, 'friends/friends-center-client.tsx'), 'utf-8');

    it('Friends tab has Message button (already exists — regression check)', () => {
      expect(source).toContain('/messages?u=');
    });

    it('PYMK tab has Message button', () => {
      // The PYMK tab renders filteredPymk — must link to messages for each person
      const pymkSection = source.slice(source.indexOf("activeTab === 'pymk'"));
      expect(pymkSection).toContain('/messages?u=');
    });

    it('Following tab has Message button', () => {
      const followingSection = source.slice(source.indexOf("activeTab === 'following'"));
      expect(followingSection).toContain('/messages?u=');
    });

    it('Followers tab has Message button', () => {
      const followersSection = source.slice(source.indexOf("activeTab === 'followers'"));
      expect(followersSection).toContain('/messages?u=');
    });
  });
});
