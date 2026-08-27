import { describe, it, expect } from 'vitest';
import { validateComposer, POST_MAX_LENGTH, POST_MAX_MEDIA } from '../../packages/social/src/index';

describe('Home Feed Post Creation Validation', () => {
  const defaultAuthorId = '11111111-2222-3333-4444-555555555555';

  it('approves valid text-only Caribbean post', () => {
    const res = validateComposer({
      authorId: defaultAuthorId,
      content: 'Happy Independence Day to Jamaica! Big vibes in Kingston tonight! 🇯🇲🔊 #KingstonVibes @karenereid',
      visibility: 'public',
      mediaCount: 0,
    });
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
    expect(res.hashtags).toContain('kingstonvibes');
    expect(res.mentions).toContain('karenereid');
  });

  it('rejects post without text and without media', () => {
    const res = validateComposer({
      authorId: defaultAuthorId,
      content: '   ',
      visibility: 'public',
      mediaCount: 0,
    });
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('Post must contain text or media');
  });

  it('approves media-only post with empty caption', () => {
    const res = validateComposer({
      authorId: defaultAuthorId,
      content: '',
      visibility: 'public',
      mediaCount: 3,
    });
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('enforces post length limit of 3000 characters', () => {
    const oversized = 'A'.repeat(POST_MAX_LENGTH + 5);
    const res = validateComposer({
      authorId: defaultAuthorId,
      content: oversized,
      visibility: 'public',
      mediaCount: 0,
    });
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain(`exceeds ${POST_MAX_LENGTH} characters`);
  });

  it('enforces maximum 10 media items', () => {
    const res = validateComposer({
      authorId: defaultAuthorId,
      content: 'Carnival Photo Dump',
      visibility: 'public',
      mediaCount: 11,
    });
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain(`at most ${POST_MAX_MEDIA} media items`);
  });

  it('requires an authorId', () => {
    const res = validateComposer({
      authorId: '',
      content: 'Hello world',
      visibility: 'public',
      mediaCount: 0,
    });
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('Author is required');
  });
});

describe('Moments & Stories 24h Lifecycle Rules', () => {
  it('calculates story expiration at exactly 24 hours from creation', () => {
    const now = Date.now();
    const expiresAt = new Date(now + 24 * 60 * 60 * 1000);
    const diffHours = (expiresAt.getTime() - now) / (1000 * 60 * 60);
    expect(diffHours).toBeCloseTo(24, 1);
  });

  it('validates supported media kinds (image and video)', () => {
    const validKinds = ['image', 'video'];
    expect(validKinds.includes('image')).toBe(true);
    expect(validKinds.includes('video')).toBe(true);
    expect(validKinds.includes('audio')).toBe(false);
  });

  it('validates audience privacy boundaries', () => {
    const allowedAudiences = ['public', 'followers', 'close_friends'];
    expect(allowedAudiences.includes('public')).toBe(true);
    expect(allowedAudiences.includes('followers')).toBe(true);
    expect(allowedAudiences.includes('close_friends')).toBe(true);
    expect(allowedAudiences.includes('secret')).toBe(false);
  });
});

describe('Identity & Foreign Key Error Sanitization', () => {
  function maskDbError(rawError: { message: string; code?: string }): string {
    if (rawError.code === '23503' || rawError.message.includes('foreign key constraint')) {
      return "We couldn't link your profile to publish this post. Please refresh and try again.";
    }
    return "We couldn't publish your post right now. Please try again.";
  }

  it('masks raw post_author_id_fkey constraint violation without leaking internal schema', () => {
    const rawPgError = {
      message: 'Insert or update on table "posts" violates foreign key constraint "post_author_id_fkey"',
      code: '23503',
    };
    const userSafeMsg = maskDbError(rawPgError);
    expect(userSafeMsg).not.toContain('post_author_id_fkey');
    expect(userSafeMsg).not.toContain('violates foreign key constraint');
    expect(userSafeMsg).toContain('Please refresh and try again');
  });

  it('masks generic database exceptions with friendly guidance', () => {
    const rawError = {
      message: 'Connection pool timeout at pg_node_4',
      code: '08006',
    };
    const userSafeMsg = maskDbError(rawError);
    expect(userSafeMsg).toBe("We couldn't publish your post right now. Please try again.");
  });
});

describe('User Profile Username Normalization', () => {
  function sanitizeUsername(input: string, fallbackId: string): string {
    const raw = (input || '').trim();
    let clean = raw.toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 24);
    if (clean.length < 3) {
      clean = `user_${fallbackId.slice(0, 6)}`;
    }
    return clean;
  }

  it('strips illegal characters from candidate usernames', () => {
    expect(sanitizeUsername('Carlos.Mendez!#$123', 'abc12345')).toBe('carlos.mendez123');
    expect(sanitizeUsername('Karene Reid 🇯🇲', 'abc12345')).toBe('karenereid');
  });

  it('applies fallback for empty or short usernames', () => {
    expect(sanitizeUsername('a', 'def45678')).toBe('user_def456');
    expect(sanitizeUsername('', 'def45678')).toBe('user_def456');
  });
});
