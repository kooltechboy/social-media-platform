import { describe, it, expect } from 'vitest';

const VALID_REACTION_TYPES = ['like','love','fire','celebrate','laugh','wow','sad','angry'] as const;
type ReactionType = typeof VALID_REACTION_TYPES[number];

function isValidReactionType(t: string): t is ReactionType {
  return (VALID_REACTION_TYPES as readonly string[]).includes(t);
}

function buildUpsertPayload(postId: string, profileId: string, reactionType: ReactionType) {
  return { post_id: postId, profile_id: profileId, reaction_type: reactionType };
}

describe('Multi-type reactions', () => {
  it('accepts all 8 valid reaction types', () => {
    const types: ReactionType[] = ['like','love','fire','celebrate','laugh','wow','sad','angry'];
    types.forEach(t => expect(isValidReactionType(t)).toBe(true));
  });

  it('rejects invalid reaction types', () => {
    expect(isValidReactionType('dislike')).toBe(false);
    expect(isValidReactionType('thumbsup')).toBe(false);
    expect(isValidReactionType('')).toBe(false);
  });

  it('builds correct upsert payload', () => {
    const payload = buildUpsertPayload('post-1', 'user-1', 'fire');
    expect(payload).toEqual({ post_id: 'post-1', profile_id: 'user-1', reaction_type: 'fire' });
  });

  it('emoji label map covers all 8 types', () => {
    const REACTION_EMOJI_MAP: Record<ReactionType, { emoji: string; label: string }> = {
      like:      { emoji: '🤍', label: 'Like' },
      love:      { emoji: '❤️', label: 'Love' },
      fire:      { emoji: '🔥', label: 'Fire' },
      celebrate: { emoji: '🎉', label: 'Celebrate' },
      laugh:     { emoji: '😂', label: 'Laugh' },
      wow:       { emoji: '😮', label: 'Wow' },
      sad:       { emoji: '😢', label: 'Sad' },
      angry:     { emoji: '😠', label: 'Angry' },
    };
    VALID_REACTION_TYPES.forEach(t => {
      expect(REACTION_EMOJI_MAP[t]).toBeDefined();
      expect(REACTION_EMOJI_MAP[t].emoji).toBeTruthy();
      expect(REACTION_EMOJI_MAP[t].label).toBeTruthy();
    });
  });
});
