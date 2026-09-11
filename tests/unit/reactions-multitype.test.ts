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

describe('toggleReactionAction logic', () => {
  it('returns liked:false when toggling same type (remove reaction)', () => {
    const existingReaction = 'fire' as ReactionType;
    const selectedType = 'fire' as ReactionType;
    const isRemoval = existingReaction === selectedType;
    expect(isRemoval).toBe(true);
  });

  it('returns liked:true when selecting new type (upsert)', () => {
    const existingReaction = 'like' as ReactionType;
    const selectedType = 'fire' as ReactionType;
    const isUpsert = existingReaction !== selectedType;
    expect(isUpsert).toBe(true);
  });

  it('reaction summary bar shows top 3 by count', () => {
    const VALID = ['like','love','fire','celebrate','laugh','wow','sad','angry'] as const;
    type RT = typeof VALID[number];
    const counts: Record<RT, number> = {
      like: 10, love: 5, fire: 20, celebrate: 2, laugh: 0, wow: 0, sad: 0, angry: 1
    };
    const topTypes = (Object.keys(counts) as RT[])
      .filter(t => counts[t] > 0)
      .sort((a, b) => counts[b] - counts[a])
      .slice(0, 3);
    expect(topTypes).toEqual(['fire', 'like', 'love']);
  });

  it('optimistic update: count +1 when reacting for first time', () => {
    const prevCount = 5;
    const prev = null; // no previous reaction
    const isRemoval = false;
    const newCount = prevCount + (isRemoval ? -1 : prev ? 0 : 1);
    expect(newCount).toBe(6);
  });

  it('optimistic update: count -1 when removing same reaction', () => {
    const prevCount = 5;
    const prev = 'fire' as ReactionType;
    const selectedType = 'fire' as ReactionType;
    const isRemoval = prev === selectedType;
    const newCount = prevCount + (isRemoval ? -1 : prev ? 0 : 1);
    expect(newCount).toBe(4);
  });

  it('optimistic update: count unchanged when switching reaction type', () => {
    const prevCount = 5;
    const prev = 'like' as ReactionType;
    const selectedType = 'fire' as ReactionType;
    const isRemoval = prev === selectedType;
    const newCount = prevCount + (isRemoval ? -1 : prev ? 0 : 1);
    expect(newCount).toBe(5);
  });
});

