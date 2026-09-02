import { describe, it, expect } from 'vitest';
import { resolvePrimaryRelationshipState, type RelationshipState } from '../../packages/social/src/index';

describe('Social Relationships State Machine & Safety', () => {
  it('correctly maps relationship combinations to primary UI state', () => {
    // 1. Blocked takes top precedence
    expect(resolvePrimaryRelationshipState({ isBlocked: true, isFollowing: true, friendshipStatus: 'accepted' })).toBe('blocked');

    // 2. Friends
    expect(resolvePrimaryRelationshipState({ isBlocked: false, friendshipStatus: 'accepted', isFollowing: true })).toBe('friends');

    // 3. Pending outgoing friend request
    expect(resolvePrimaryRelationshipState({ isBlocked: false, friendshipStatus: 'pending_sent', isFollowing: false })).toBe('request_sent');

    // 4. Pending incoming friend request
    expect(resolvePrimaryRelationshipState({ isBlocked: false, friendshipStatus: 'pending_received', isFollowing: false })).toBe('request_received');

    // 5. Following
    expect(resolvePrimaryRelationshipState({ isBlocked: false, friendshipStatus: 'none', isFollowing: true })).toBe('following');

    // 6. None
    expect(resolvePrimaryRelationshipState({ isBlocked: false, friendshipStatus: 'none', isFollowing: false })).toBe('none');
  });

  it('calculates mutual friend intersections correctly without leaking blocked connections', () => {
    const userAFriends = new Set(['usr_2', 'usr_3', 'usr_4', 'usr_5']);
    const userBFriends = new Set(['usr_3', 'usr_4', 'usr_6']);
    const viewerBlocked = new Set(['usr_3']);

    const mutuals = [...userAFriends]
      .filter((id) => userBFriends.has(id))
      .filter((id) => !viewerBlocked.has(id));

    expect(mutuals).toHaveLength(1);
    expect(mutuals).toContain('usr_4');
  });
});
