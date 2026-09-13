import { describe, it, expect } from 'vitest';
import {
  resolvePrimaryRelationshipState,
  getRelationshipActionConfig,
  type RelationshipState,
} from '../../packages/social/src/index';

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

    // 7. Followed by (target follows viewer, viewer does not follow back)
    expect(resolvePrimaryRelationshipState({ isBlocked: false, friendshipStatus: 'none', isFollowing: false, isFollower: true })).toBe('followed_by');

    // 8. Mutual follow (both follow each other, not friends)
    expect(resolvePrimaryRelationshipState({ isBlocked: false, friendshipStatus: 'none', isFollowing: true, isFollower: true })).toBe('mutual_follow');
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

  it('generates context-aware UI action configs strictly adhering to Tukubi rules', () => {
    // 1. Official accounts: follow & message only; never friend
    const officialConfig = getRelationshipActionConfig({ isOfficial: true, isFollowing: false });
    expect(officialConfig.canFriend).toBe(false);
    expect(officialConfig.canFollow).toBe(true);
    expect(officialConfig.followLabel).toBe('Follow');
    expect(officialConfig.canMessage).toBe(true);

    const officialFollowing = getRelationshipActionConfig({ isOfficial: true, isFollowing: true });
    expect(officialFollowing.canFriend).toBe(false);
    expect(officialFollowing.followLabel).toBe('Following');

    // 2. Stranger: Add Friend, Follow, Message
    const strangerConfig = getRelationshipActionConfig({ isFollowing: false, friendshipStatus: 'none' });
    expect(strangerConfig.canFriend).toBe(true);
    expect(strangerConfig.friendLabel).toBe('Add Friend');
    expect(strangerConfig.followLabel).toBe('Follow');
    expect(strangerConfig.canMessage).toBe(true);

    // 3. Follower (Follow Back): Add Friend, Follow Back, Message
    const followerConfig = getRelationshipActionConfig({ isFollower: true, isFollowing: false, friendshipStatus: 'none' });
    expect(followerConfig.followLabel).toBe('Follow Back');
    expect(followerConfig.canFriend).toBe(true);

    // 4. Friends: Friends indicator (no duplicate Add Friend), Following indicator, Message
    const friendConfig = getRelationshipActionConfig({ friendshipStatus: 'accepted', isFollowing: true });
    expect(friendConfig.friendLabel).toBe('Friends');
    expect(friendConfig.canFriend).toBe(false);
    expect(friendConfig.followLabel).toBe('Following');
    expect(friendConfig.canMessage).toBe(true);

    // 5. Request Sent: Request Sent indicator, Follow, Message
    const sentConfig = getRelationshipActionConfig({ friendshipStatus: 'pending_sent', isFollowing: false });
    expect(sentConfig.friendLabel).toBe('Request Sent');
    expect(sentConfig.canFriend).toBe(false);

    // 6. Blocked: Everything disabled
    const blockedConfig = getRelationshipActionConfig({ isBlocked: true });
    expect(blockedConfig.canFriend).toBe(false);
    expect(blockedConfig.canFollow).toBe(false);
    expect(blockedConfig.canMessage).toBe(false);
  });
});

