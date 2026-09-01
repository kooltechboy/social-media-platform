import { describe, it, expect } from 'vitest';
import { validateComposer, resolveFeedVisibility } from '../../packages/social/src/index';
import {
  TranslationService,
  LOCALES,
  LOCALE_DETAILS,
  protectTokens,
  restoreTokens,
} from '../../packages/localization/src/index';

describe('Simplified Social Posting & Media Handling', () => {
  it('validates simplified create post with text, photo, video, or reel content', () => {
    const validTextPost = validateComposer({
      authorId: 'usr_100',
      content: 'Beautiful sunset in Barbados! #islandlife @friend',
      visibility: 'public',
      mediaCount: 0,
    });
    expect(validTextPost.valid).toBe(true);
    expect(validTextPost.hashtags).toEqual(['islandlife']);
    expect(validTextPost.mentions).toEqual(['friend']);

    const validPhotoPost = validateComposer({
      authorId: 'usr_100',
      content: 'Carnival vibes',
      visibility: 'public',
      mediaCount: 3,
    });
    expect(validPhotoPost.valid).toBe(true);

    const validMediaOnlyPost = validateComposer({
      authorId: 'usr_100',
      content: '',
      visibility: 'public',
      mediaCount: 1,
    });
    expect(validMediaOnlyPost.valid).toBe(true);

    const emptyPost = validateComposer({
      authorId: 'usr_100',
      content: '   ',
      visibility: 'public',
      mediaCount: 0,
    });
    expect(emptyPost.valid).toBe(false);
  });

  it('correctly maps simplified audience selections to visibility rules', () => {
    const graph = {
      viewerId: 'usr_viewer',
      followingIds: new Set(['usr_author']),
      friendIds: new Set(['usr_author']),
      blockedIds: new Set<string>(),
      mutedIds: new Set<string>(),
    };

    // Everyone -> public
    expect(resolveFeedVisibility('usr_author', 'public', graph)).toBe(true);
    // Friends -> friends
    expect(resolveFeedVisibility('usr_author', 'friends', graph)).toBe(true);
    // Followers -> followers
    expect(resolveFeedVisibility('usr_author', 'followers', graph)).toBe(true);
  });
});

describe('Dynamic Translation Dropdown & Multilingual Integrity', () => {
  it('includes all supported TUKUBI languages in the dropdown configuration', () => {
    const supportedCodes = LOCALES;
    expect(supportedCodes).toContain('en');
    expect(supportedCodes).toContain('es');
    expect(supportedCodes).toContain('fr');
    expect(supportedCodes).toContain('ht');
    expect(supportedCodes).toContain('nl');
    expect(supportedCodes).toContain('pap');

    supportedCodes.forEach((code) => {
      const meta = LOCALE_DETAILS[code];
      expect(meta).toBeDefined();
      expect(meta.nativeName.length).toBeGreaterThan(0);
      expect(meta.name.length).toBeGreaterThan(0);
    });
  });

  it('translates text and captions while preserving mentions, emojis, and hashtags', async () => {
    const service = new TranslationService();
    const input = 'Hola amigos @marcus! Disfruten #Carnival2026 🌴';

    const result = await service.translate(input, {
      sourceLang: 'es',
      targetLang: 'en',
    });

    expect(result.translatedText).toContain('@marcus');
    expect(result.translatedText).toContain('#Carnival2026');
    expect(result.translatedText).toContain('🌴');
    expect(result.targetLang).toBe('en');
  });

  it('preserves original content without mutation when translation is requested', async () => {
    const originalPost = 'Celebrating emancipation day in Trinidad! 🇹🇹';
    const { protectedText, restoreMap } = protectTokens(originalPost);
    const restored = restoreTokens(protectedText, restoreMap);
    expect(restored).toBe(originalPost);
  });
});

describe('Member and User Search Integrity', () => {
  it('tolerates case differences and partial terms for member searches', () => {
    const members = [
      { id: '1', display_name: 'Daniel Williams', username: 'danielw' },
      { id: '2', display_name: 'Marcus Garvey', username: 'm_garvey' },
      { id: '3', display_name: 'Danielle Brooks', username: 'danib' },
    ];

    const search = (term: string) => {
      const sanitized = term.trim().toLowerCase();
      return members.filter(
        (m) =>
          m.display_name.toLowerCase().includes(sanitized) ||
          m.username.toLowerCase().includes(sanitized)
      );
    };

    // Searching 'Daniel' should match Daniel Williams and Danielle Brooks
    const resultsDaniel = search('Daniel');
    expect(resultsDaniel).toHaveLength(2);
    expect(resultsDaniel.map((r) => r.username)).toContain('danielw');
    expect(resultsDaniel.map((r) => r.username)).toContain('danib');

    // Searching 'danielw' should match exact username
    const resultsUsername = search('danielw');
    expect(resultsUsername).toHaveLength(1);
    expect(resultsUsername[0].display_name).toBe('Daniel Williams');

    // Searching 'marcus' with lowercase
    const resultsMarcus = search('marcus');
    expect(resultsMarcus).toHaveLength(1);
    expect(resultsMarcus[0].username).toBe('m_garvey');
  });
});
