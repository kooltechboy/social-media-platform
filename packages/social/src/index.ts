import { encodeCursor, decodeCursor, type SqlStatement, type Visibility } from '@caribbean/database';

export const FEED_MODES = ['for_you', 'following', 'friends', 'caribbean', 'local', 'communities', 'latest'] as const;
export type FeedMode = (typeof FEED_MODES)[number];

export const POST_MAX_LENGTH = 3000;
export const POST_MAX_MEDIA = 10;
export const PAGE_SIZE = 25;

export function isFeedMode(value: string): value is FeedMode {
  return (FEED_MODES as readonly string[]).includes(value);
}

export interface FeedQueryInput {
  viewerId: string;
  mode: FeedMode;
  limit?: number;
  cursor?: string;
  countryIso?: string;
  cityId?: string;
  communityId?: string;
}

export interface FeedQuery {
  statement: SqlStatement;
  hasNextCursor: (lastRow: { created_at: string; id: string }) => string | null;
}

const FEED_COLUMNS = 'id, author_id, content, visibility, country_id, created_at';

export function buildFeedQuery(input: FeedQueryInput): FeedQuery {
  const limit = Math.min(Math.max(input.limit ?? PAGE_SIZE, 1), 50);
  const where: string[] = [];
  const params: unknown[] = [];
  const param = (value: unknown): string => {
    params.push(value);
    return `$${params.length}`;
  };

  where.push(`visibility = 'public' OR author_id = ${param(input.viewerId)}`);

  switch (input.mode) {
    case 'following':
      where.push(`author_id IN (SELECT following_id FROM public.follows WHERE follower_id = ${param(input.viewerId)})`);
      break;
    case 'friends':
      where.push(`author_id IN (
        SELECT addressee_id FROM public.friendships WHERE requester_id = ${param(input.viewerId)} AND status = 'accepted'
        UNION
        SELECT requester_id FROM public.friendships WHERE addressee_id = ${param(input.viewerId)} AND status = 'accepted'
      )`);
      break;
    case 'caribbean':
      where.push(`country_id IS NOT NULL`);
      if (input.countryIso) {
        where.push(`country_id IN (SELECT id FROM public.countries WHERE iso_code = ${param(input.countryIso)})`);
      }
      break;
    case 'local':
      if (input.cityId) {
        where.push(`author_id IN (
          SELECT pi.profile_id FROM public.profile_identity pi
          WHERE (pi.current_city_id = ${param(input.cityId)} OR pi.origin_city_id = ${param(input.cityId)})
            AND pi.visibility != 'private'
        )`);
      }
      break;
    case 'communities':
      if (!input.communityId) {
        throw new Error('communities feed requires communityId');
      }
      where.push(`author_id IN (
        SELECT cm.profile_id FROM public.community_members cm
        WHERE cm.community_id = ${param(input.communityId)} AND cm.membership_status = 'active'
      )`);
      break;
    case 'for_you':
    case 'latest':
    default:
      break;
  }

  if (input.cursor) {
    const decoded = decodeCursor(input.cursor);
    where.push(`(created_at, id) < (${param(decoded.sortKey)}::timestamptz, ${param(decoded.id)}::uuid)`);
  }

  const statement: SqlStatement = {
    text: `SELECT ${FEED_COLUMNS} FROM public.posts WHERE ${where.join(' AND ')} ORDER BY created_at DESC, id DESC LIMIT ${limit + 1}`,
    params,
  };

  return {
    statement,
    hasNextCursor: (lastRow) => encodeCursor({ sortKey: lastRow.created_at, id: lastRow.id }),
  };
}

export interface ComposerInput {
  authorId: string;
  content: string;
  visibility: Visibility;
  mediaCount: number;
}

export interface ComposerResult {
  valid: boolean;
  errors: string[];
  hashtags: string[];
  mentions: string[];
}

const HASHTAG_PATTERN = /#([\p{L}\p{N}_]{1,60})/gu;
const MENTION_PATTERN = /@([a-z0-9_.]{1,30})/giu;

export function validateComposer(input: ComposerInput): ComposerResult {
  const errors: string[] = [];
  if (!input.authorId) errors.push('Author is required');
  if (input.content.length > POST_MAX_LENGTH) {
    errors.push(`Content exceeds ${POST_MAX_LENGTH} characters`);
  }
  if (!input.content.trim() && input.mediaCount === 0) {
    errors.push('Post must contain text or media');
  }
  if (input.mediaCount > POST_MAX_MEDIA) {
    errors.push(`Post allows at most ${POST_MAX_MEDIA} media items`);
  }
  const hashtags = [...input.content.matchAll(HASHTAG_PATTERN)].map((match) => match[1].toLowerCase());
  const mentions = [...input.content.matchAll(MENTION_PATTERN)].map((match) => match[1].toLowerCase());
  return { valid: errors.length === 0, errors, hashtags, mentions };
}

export interface GraphContext {
  viewerId: string;
  followingIds: Set<string>;
  friendIds: Set<string>;
  blockedIds: Set<string>;
  mutedIds: Set<string>;
}

export function resolveFeedVisibility(authorId: string, visibility: Visibility, graph: GraphContext): boolean {
  if (graph.viewerId === authorId) return true;
  if (graph.blockedIds.has(authorId) || graph.mutedIds.has(authorId)) return false;
  switch (visibility) {
    case 'public':
      return true;
    case 'followers':
      return graph.followingIds.has(authorId);
    case 'friends':
      return graph.friendIds.has(authorId);
    case 'private':
      return false;
    default:
      return false;
  }
}

// =============================================================================
// SOCIAL RELATIONSHIP STATE MACHINE
// =============================================================================

export type RelationshipState =
  | 'none'
  | 'following'
  | 'followed_by'
  | 'mutual_follow'
  | 'request_sent'
  | 'friend_request_sent'
  | 'request_received'
  | 'friend_request_received'
  | 'friends'
  | 'blocked'
  | 'muted';

export interface UserRelationship {
  targetUserId: string;
  isFollowing: boolean;
  isFollower?: boolean;
  friendshipStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'declined';
  isBlocked: boolean;
  isMuted?: boolean;
  primaryState: RelationshipState;
}

/**
 * Resolves high-level primary relationship state for UI buttons and interactions
 */
export function resolvePrimaryRelationshipState(rel: {
  isBlocked?: boolean;
  isMuted?: boolean;
  friendshipStatus?: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'declined';
  isFollowing?: boolean;
  isFollower?: boolean;
}): RelationshipState {
  if (rel.isBlocked) return 'blocked';
  if (rel.friendshipStatus === 'accepted') return 'friends';
  if (rel.friendshipStatus === 'pending_sent') return 'request_sent';
  if (rel.friendshipStatus === 'pending_received') return 'request_received';
  if (rel.isFollowing && rel.isFollower) return 'mutual_follow';
  if (rel.isFollowing) return 'following';
  if (rel.isFollower) return 'followed_by';
  if (rel.isMuted) return 'muted';
  return 'none';
}

export interface RelationshipActionConfig {
  canFriend: boolean;
  friendLabel: string;
  friendState: 'none' | 'request_sent' | 'request_received' | 'friends';
  canFollow: boolean;
  followLabel: string;
  isFollowing: boolean;
  canMessage: boolean;
  isOfficial: boolean;
}

/**
 * Derives UI action configurations for profile cards and header actions
 * adhering to Tukubi relationship rules:
 * - Official accounts never display "Add Friend"
 * - Mutual friendships show "Friends" and allow Messaging
 * - Pending states show "Request Sent" or "Accept/Decline"
 */
export function getRelationshipActionConfig(
  rel: {
    isBlocked?: boolean;
    friendshipStatus?: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'declined';
    isFollowing?: boolean;
    isFollower?: boolean;
    isOfficial?: boolean;
  }
): RelationshipActionConfig {
  const isOfficial = !!rel.isOfficial;
  const isBlocked = !!rel.isBlocked;
  const friendshipStatus = rel.friendshipStatus || 'none';
  const isFollowing = !!rel.isFollowing;
  const isFollower = !!rel.isFollower;

  if (isBlocked) {
    return {
      canFriend: false,
      friendLabel: 'Blocked',
      friendState: 'none',
      canFollow: false,
      followLabel: 'Blocked',
      isFollowing: false,
      canMessage: false,
      isOfficial,
    };
  }

  // Official accounts: follow & message only; never friend
  if (isOfficial) {
    return {
      canFriend: false,
      friendLabel: '',
      friendState: 'none',
      canFollow: true,
      followLabel: isFollowing ? 'Following' : 'Follow',
      isFollowing,
      canMessage: true,
      isOfficial: true,
    };
  }

  let friendLabel = 'Add Friend';
  let friendState: 'none' | 'request_sent' | 'request_received' | 'friends' = 'none';
  let canFriend = true;

  if (friendshipStatus === 'accepted') {
    friendLabel = 'Friends';
    friendState = 'friends';
    canFriend = false; // Already friends
  } else if (friendshipStatus === 'pending_sent') {
    friendLabel = 'Request Sent';
    friendState = 'request_sent';
    canFriend = false; // Pending
  } else if (friendshipStatus === 'pending_received') {
    friendLabel = 'Respond';
    friendState = 'request_received';
    canFriend = true; // Needs respond
  }

  let followLabel = 'Follow';
  if (isFollowing) {
    followLabel = 'Following';
  } else if (isFollower) {
    followLabel = 'Follow Back';
  }

  return {
    canFriend,
    friendLabel,
    friendState,
    canFollow: true,
    followLabel,
    isFollowing,
    canMessage: true,
    isOfficial: false,
  };
}

/**
 * Returns true strictly if the relationship represents an explicit accepted friendship.
 * Under TUKUBI Core Product Rule, following, community membership, or interactions
 * NEVER equate to friendship.
 */
export function isAcceptedFriend(status?: string | null): boolean {
  return status === 'accepted';
}

/**
 * Returns strictly formatted mutual friend text: "1 mutual friend" or "X mutual friends".
 * Never displays followers or shared groups as mutual friends.
 */
export function formatMutualFriendsCount(count: number): string | null {
  if (!count || count <= 0) return null;
  return count === 1 ? '1 mutual friend' : `${count.toLocaleString('en-US')} mutual friends`;
}

export type RelationshipBadgeType = 'friend' | 'member' | 'following' | 'follower' | 'official';

export interface RelationshipBadge {
  type: RelationshipBadgeType;
  label: string;
}

/**
 * Resolves the explicit social status badge for directory and search cards
 */
export function resolveRelationshipBadge(rel: {
  isOfficial?: boolean;
  friendshipStatus?: string;
  isFollowing?: boolean;
  isFollower?: boolean;
}): RelationshipBadge {
  if (rel.isOfficial) {
    return { type: 'official', label: 'Official' };
  }
  if (rel.friendshipStatus === 'accepted') {
    return { type: 'friend', label: 'Friend' };
  }
  if (rel.isFollowing) {
    return { type: 'following', label: 'Following' };
  }
  if (rel.isFollower) {
    return { type: 'follower', label: 'Follower' };
  }
  return { type: 'member', label: 'Member' };
}

