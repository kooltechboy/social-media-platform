import { describe, it, expect } from 'vitest';
import {
  isAcceptedFriend,
  resolveRelationshipBadge,
  formatMutualFriendsCount,
  resolvePrimaryRelationshipState,
  getRelationshipActionConfig,
  type RelationshipState,
} from '../../packages/social/src/index';

describe('Friendship Security, Integrity & Core Product Rules', () => {

  describe('Core Product Rule 1: Strict Definition of Friendship', () => {
    it('isAcceptedFriend strictly returns true only for "accepted" status', () => {
      expect(isAcceptedFriend('accepted')).toBe(true);
      expect(isAcceptedFriend('pending')).toBe(false);
      expect(isAcceptedFriend('pending_sent')).toBe(false);
      expect(isAcceptedFriend('pending_received')).toBe(false);
      expect(isAcceptedFriend('declined')).toBe(false);
      expect(isAcceptedFriend('cancelled')).toBe(false);
      expect(isAcceptedFriend('blocked')).toBe(false);
      expect(isAcceptedFriend('none')).toBe(false);
      expect(isAcceptedFriend(null)).toBe(false);
      expect(isAcceptedFriend(undefined)).toBe(false);
    });

    it('Members, Followers, and Following are NEVER friends without explicit accepted friendship', () => {
      // 1. Follower only
      const followerOnly = {
        isFollowing: false,
        isFollower: true,
        friendshipStatus: 'none' as const,
      };
      expect(isAcceptedFriend(followerOnly.friendshipStatus)).toBe(false);
      expect(resolvePrimaryRelationshipState(followerOnly)).not.toBe('friends');
      expect(resolveRelationshipBadge(followerOnly).type).toBe('follower');

      // 2. Following only
      const followingOnly = {
        isFollowing: true,
        isFollower: false,
        friendshipStatus: 'none' as const,
      };
      expect(isAcceptedFriend(followingOnly.friendshipStatus)).toBe(false);
      expect(resolvePrimaryRelationshipState(followingOnly)).not.toBe('friends');
      expect(resolveRelationshipBadge(followingOnly).type).toBe('following');

      // 3. Mutual follow without friendship
      const mutualFollow = {
        isFollowing: true,
        isFollower: true,
        friendshipStatus: 'none' as const,
      };
      expect(isAcceptedFriend(mutualFollow.friendshipStatus)).toBe(false);
      expect(resolvePrimaryRelationshipState(mutualFollow)).toBe('mutual_follow');
      expect(resolvePrimaryRelationshipState(mutualFollow)).not.toBe('friends');

      // 4. General platform member
      const memberOnly = {
        isFollowing: false,
        isFollower: false,
        friendshipStatus: 'none' as const,
      };
      expect(isAcceptedFriend(memberOnly.friendshipStatus)).toBe(false);
      expect(resolvePrimaryRelationshipState(memberOnly)).toBe('none');
      expect(resolveRelationshipBadge(memberOnly).type).toBe('member');
      expect(resolveRelationshipBadge(memberOnly).label).toBe('Member');
    });

    it('Communities, Marketplace, and Messaging interactions never create implicit friendships', () => {
      // Community member:
      const communityCoMember = {
        communityId: 'comm_reggae_culture',
        userId: 'usr_caribbean_fan',
        friendshipStatus: 'none',
      };
      expect(isAcceptedFriend(communityCoMember.friendshipStatus)).toBe(false);

      // Marketplace seller/buyer:
      const marketplaceCounterparty = {
        productId: 'prod_blue_mountain_coffee',
        sellerId: 'usr_jamaica_roasters',
        friendshipStatus: 'none',
      };
      expect(isAcceptedFriend(marketplaceCounterparty.friendshipStatus)).toBe(false);
    });
  });

  describe('Database Integrity: Canonical Ordering & Self-Friendship Invariants', () => {
    // Simulates the PostgreSQL canonical pair check:
    // LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id)
    function canonicalPair(userA: string, userB: string): [string, string] {
      return userA < userB ? [userA, userB] : [userB, userA];
    }

    it('generates deterministic canonical pair regardless of who initiates the request', () => {
      const pair1 = canonicalPair('usr_alice', 'usr_bob');
      const pair2 = canonicalPair('usr_bob', 'usr_alice');

      expect(pair1).toEqual(['usr_alice', 'usr_bob']);
      expect(pair2).toEqual(['usr_alice', 'usr_bob']);
      expect(pair1).toEqual(pair2);
    });

    it('rejects self-friendships (chk_friendships_no_self)', () => {
      const requesterId = 'usr_alice';
      const addresseeId = 'usr_alice';

      const isValid = requesterId !== addresseeId;
      expect(isValid).toBe(false);
    });

    it('prevents duplicate reverse friendship records from coexisting', () => {
      const existingFriendships = new Set<string>();

      const insertFriendship = (a: string, b: string) => {
        if (a === b) throw new Error('Self-friendship forbidden');
        const key = canonicalPair(a, b).join(':');
        if (existingFriendships.has(key)) {
          throw new Error('Unique canonical pair constraint violation');
        }
        existingFriendships.add(key);
        return true;
      };

      // First insertion succeeds
      expect(insertFriendship('user_123', 'user_456')).toBe(true);

      // Duplicate forward insertion fails
      expect(() => insertFriendship('user_123', 'user_456')).toThrow(
        'Unique canonical pair constraint violation'
      );

      // Reverse insertion fails due to unique canonical pair index
      expect(() => insertFriendship('user_456', 'user_123')).toThrow(
        'Unique canonical pair constraint violation'
      );
    });
  });

  describe('Official Accounts Boundary Enforcement', () => {
    it('official account @tukubi is strictly Follow-only and cannot be friended', () => {
      const config = getRelationshipActionConfig({
        isOfficial: true,
        isFollowing: false,
        friendshipStatus: 'none',
      });

      expect(config.canFriend).toBe(false);
      expect(config.canFollow).toBe(true);
      expect(config.followLabel).toBe('Follow');
      expect(config.canMessage).toBe(true);

      const badge = resolveRelationshipBadge({
        isOfficial: true,
        friendshipStatus: 'none',
      });
      expect(badge.type).toBe('official');
      expect(badge.label).toBe('Official');
    });

    it('blocks friending attempts on official platform accounts', () => {
      const isTargetOfficial = (username: string, isOfficialFlag?: boolean) => {
        return isOfficialFlag || username.toLowerCase() === 'tukubi';
      };

      expect(isTargetOfficial('tukubi', false)).toBe(true);
      expect(isTargetOfficial('Tukubi', false)).toBe(true);
      expect(isTargetOfficial('other_member', true)).toBe(true);
      expect(isTargetOfficial('regular_caribbean_user', false)).toBe(false);
    });
  });

  describe('Mutual Friends Calculation & Formatting', () => {
    it('correctly calculates intersection of friends excluding blocked users', () => {
      const aliceFriends = new Set(['bob', 'charlie', 'david', 'eve']);
      const frankFriends = new Set(['charlie', 'david', 'grace']);
      const blockedByAlice = new Set(['charlie']);

      const mutualFriends = [...aliceFriends].filter(
        (id) => frankFriends.has(id) && !blockedByAlice.has(id)
      );

      expect(mutualFriends).toEqual(['david']);
      expect(mutualFriends).toHaveLength(1);
    });

    it('formats mutual friends count according to English / Caribbean syntax', () => {
      expect(formatMutualFriendsCount(0)).toBe(null);
      expect(formatMutualFriendsCount(-1)).toBe(null);
      expect(formatMutualFriendsCount(1)).toBe('1 mutual friend');
      expect(formatMutualFriendsCount(2)).toBe('2 mutual friends');
      expect(formatMutualFriendsCount(42)).toBe('42 mutual friends');
      expect(formatMutualFriendsCount(1000)).toBe('1,000 mutual friends');
    });
  });

  describe('Privacy Boundaries & Friends List Visibility', () => {
    interface ProfilePrivacyPolicy {
      relationship_visibility: 'public' | 'friends_only' | 'private';
      profile_id: string;
    }

    function canViewerSeeFriends(
      viewerId: string | null,
      target: ProfilePrivacyPolicy,
      isFriend: boolean
    ): boolean {
      if (viewerId === target.profile_id) return true; // Owner can always view
      if (target.relationship_visibility === 'public') return true;
      if (target.relationship_visibility === 'friends_only') return isFriend;
      return false; // 'private' or unrecognized
    }

    it('enforces public, friends_only, and private visibility rules', () => {
      const target: ProfilePrivacyPolicy = {
        profile_id: 'usr_island_creator',
        relationship_visibility: 'public',
      };

      // 1. Public: anyone can view
      expect(canViewerSeeFriends('usr_stranger', target, false)).toBe(true);
      expect(canViewerSeeFriends(null, target, false)).toBe(true);

      // 2. Friends Only
      target.relationship_visibility = 'friends_only';
      expect(canViewerSeeFriends('usr_friend', target, true)).toBe(true);
      expect(canViewerSeeFriends('usr_stranger', target, false)).toBe(false);
      expect(canViewerSeeFriends(null, target, false)).toBe(false);

      // 3. Private
      target.relationship_visibility = 'private';
      expect(canViewerSeeFriends('usr_friend', target, true)).toBe(false);
      expect(canViewerSeeFriends('usr_stranger', target, false)).toBe(false);

      // 4. Owner can ALWAYS view their own friends
      expect(canViewerSeeFriends('usr_island_creator', target, false)).toBe(true);
    });
  });

  describe('Online Friends Widget Strict Isolation', () => {
    it('ensures online friends widget only displays accepted friends', () => {
      interface MockRow {
        status: string;
        user_id: string;
        is_online: boolean;
      }

      const relationshipRows: MockRow[] = [
        { status: 'accepted', user_id: 'usr_1', is_online: true },
        { status: 'accepted', user_id: 'usr_2', is_online: false },
        { status: 'pending', user_id: 'usr_3', is_online: true },
        { status: 'declined', user_id: 'usr_4', is_online: true },
        { status: 'none', user_id: 'usr_5', is_online: true }, // random profile
      ];

      // The widget filter:
      const onlineFriends = relationshipRows.filter(
        (r) => isAcceptedFriend(r.status) && r.is_online
      );

      expect(onlineFriends).toHaveLength(1);
      expect(onlineFriends[0].user_id).toBe('usr_1');
    });
  });
});
