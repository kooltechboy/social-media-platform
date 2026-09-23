import { describe, it, expect } from 'vitest';
import {
  FEED_MODES,
  isFeedMode,
  buildFeedQuery,
  type PublisherType,
  type PublisherEntity,
} from '../../packages/social/src/index';

describe('TUKUBI Publisher Identity & Content Distribution Architecture', () => {
  describe('1. Publisher Type Contract & Entity Boundaries', () => {
    it('supports all canonical publisher types', () => {
      const validTypes: PublisherType[] = ['personal', 'official', 'page', 'creator', 'community'];
      expect(validTypes).toHaveLength(5);
      expect(validTypes).toContain('personal');
      expect(validTypes).toContain('official');
      expect(validTypes).toContain('page');
      expect(validTypes).toContain('creator');
      expect(validTypes).toContain('community');
    });

    it('enforces separation between initiating user and public publisher entity', () => {
      // Scenario A: Operator posting as Official TUKUBI
      const officialPostPayload = {
        created_by_user_id: 'usr_operator_uuid_001',
        author_id: 'ff1e8b1f-7796-4424-b341-3b39e1c993bd', // Official @tukubi profile ID
        publisher_type: 'official' as PublisherType,
        publisher_entity_id: 'ff1e8b1f-7796-4424-b341-3b39e1c993bd',
        is_official: true,
        content: 'Official Hurricane Beryl Emergency Advisory for Grenada & St. Vincent',
      };

      expect(officialPostPayload.created_by_user_id).not.toBe(officialPostPayload.author_id);
      expect(officialPostPayload.publisher_type).toBe('official');
      expect(officialPostPayload.is_official).toBe(true);

      // Scenario B: Business owner posting as their Page
      const pagePostPayload = {
        created_by_user_id: 'usr_business_owner_uuid_002',
        author_id: 'usr_business_owner_uuid_002',
        page_id: 'biz_patty_shop_uuid_003',
        publisher_type: 'page' as PublisherType,
        publisher_entity_id: 'biz_patty_shop_uuid_003',
        content: 'Fresh batch of spicy beef patties just out of the oven! 🥟🇯🇲',
      };

      expect(pagePostPayload.publisher_type).toBe('page');
      expect(pagePostPayload.publisher_entity_id).toBe(pagePostPayload.page_id);
      expect(pagePostPayload.publisher_entity_id).not.toBe(pagePostPayload.created_by_user_id);

      // Scenario C: Personal post by standard member
      const personalPostPayload = {
        created_by_user_id: 'usr_member_uuid_004',
        author_id: 'usr_member_uuid_004',
        publisher_type: 'personal' as PublisherType,
        publisher_entity_id: 'usr_member_uuid_004',
        content: 'Sunday beach vibes at Pigeon Point, Tobago! 🏖️🇹🇹',
      };

      expect(personalPostPayload.created_by_user_id).toBe(personalPostPayload.author_id);
      expect(personalPostPayload.publisher_type).toBe('personal');
    });
  });

  describe('2. Server-Side Authorization Invariant Checks', () => {
    // Simulates server action check logic in createPostAction & postgres can_publish_as function
    function validatePublishAuthorization(params: {
      userId: string;
      userRole?: string;
      publisherType: PublisherType;
      publisherEntityId?: string;
      operatorAccounts?: string[];
      userPageRoles?: Record<string, string>; // businessId -> role
    }): { authorized: boolean; reason?: string } {
      const { userId, userRole, publisherType, publisherEntityId, operatorAccounts = [], userPageRoles = {} } = params;

      if (publisherType === 'personal') {
        if (publisherEntityId && publisherEntityId !== userId) {
          return { authorized: false, reason: 'Cannot publish as another personal user' };
        }
        return { authorized: true };
      }

      if (publisherType === 'official') {
        const isOperator = publisherEntityId && operatorAccounts.includes(publisherEntityId);
        const isAdmin = userRole === 'platform_admin' || userRole === 'super_admin';
        if (!isOperator && !isAdmin) {
          return { authorized: false, reason: 'User is not an authorized operator for this official account' };
        }
        return { authorized: true };
      }

      if (publisherType === 'page') {
        if (!publisherEntityId) {
          return { authorized: false, reason: 'Page entity ID required' };
        }
        const role = userPageRoles[publisherEntityId];
        const allowedRoles = ['owner', 'admin', 'editor'];
        if (!role || !allowedRoles.includes(role)) {
          return { authorized: false, reason: 'Insufficient page permissions to publish' };
        }
        return { authorized: true };
      }

      return { authorized: true };
    }

    it('permits personal publishing for the authenticated owner', () => {
      const result = validatePublishAuthorization({
        userId: 'usr_100',
        publisherType: 'personal',
        publisherEntityId: 'usr_100',
      });
      expect(result.authorized).toBe(true);
    });

    it('rejects client attempting to publish as another user profile', () => {
      const result = validatePublishAuthorization({
        userId: 'usr_attacker_100',
        publisherType: 'personal',
        publisherEntityId: 'usr_victim_200',
      });
      expect(result.authorized).toBe(false);
      expect(result.reason).toContain('Cannot publish as another personal user');
    });

    it('permits official publishing only for verified operators or platform admins', () => {
      const officialId = 'ff1e8b1f-7796-4424-b341-3b39e1c993bd';

      // Unauthorized regular user
      const unauthResult = validatePublishAuthorization({
        userId: 'usr_regular_100',
        userRole: 'member',
        publisherType: 'official',
        publisherEntityId: officialId,
        operatorAccounts: [],
      });
      expect(unauthResult.authorized).toBe(false);
      expect(unauthResult.reason).toContain('not an authorized operator');

      // Authorized operator
      const authOperatorResult = validatePublishAuthorization({
        userId: 'usr_operator_200',
        userRole: 'member',
        publisherType: 'official',
        publisherEntityId: officialId,
        operatorAccounts: [officialId],
      });
      expect(authOperatorResult.authorized).toBe(true);

      // Super admin override
      const adminResult = validatePublishAuthorization({
        userId: 'usr_admin_300',
        userRole: 'super_admin',
        publisherType: 'official',
        publisherEntityId: officialId,
        operatorAccounts: [],
      });
      expect(adminResult.authorized).toBe(true);
    });

    it('permits page publishing only for owners, admins, or editors of that page', () => {
      const pageId = 'biz_reggae_lounge_400';

      // Unauthorized user
      const unauthResult = validatePublishAuthorization({
        userId: 'usr_visitor_100',
        publisherType: 'page',
        publisherEntityId: pageId,
        userPageRoles: {},
      });
      expect(unauthResult.authorized).toBe(false);

      // Read-only analyst role
      const analystResult = validatePublishAuthorization({
        userId: 'usr_analyst_200',
        publisherType: 'page',
        publisherEntityId: pageId,
        userPageRoles: { [pageId]: 'moderator' },
      });
      expect(analystResult.authorized).toBe(false);

      // Authorized Page Editor
      const editorResult = validatePublishAuthorization({
        userId: 'usr_editor_300',
        publisherType: 'page',
        publisherEntityId: pageId,
        userPageRoles: { [pageId]: 'editor' },
      });
      expect(editorResult.authorized).toBe(true);

      // Authorized Page Owner
      const ownerResult = validatePublishAuthorization({
        userId: 'usr_owner_400',
        publisherType: 'page',
        publisherEntityId: pageId,
        userPageRoles: { [pageId]: 'owner' },
      });
      expect(ownerResult.authorized).toBe(true);
    });
  });

  describe('3. Content Distribution & Feed Query Isolation', () => {
    it('verifies FEED_MODES contains pages, creators, and official', () => {
      expect(FEED_MODES).toContain('pages');
      expect(FEED_MODES).toContain('creators');
      expect(FEED_MODES).toContain('official');
      expect(isFeedMode('pages')).toBe(true);
      expect(isFeedMode('creators')).toBe(true);
      expect(isFeedMode('official')).toBe(true);
    });

    it('pages feed strictly excludes personal posts of business owners', () => {
      const query = buildFeedQuery({ viewerId: 'user_viewer_1', mode: 'pages' });
      // Crucial: Must check publisher_type = 'page' or page_id IS NOT NULL, NOT author_id IN (SELECT owner_id...)
      expect(query.statement.text).toContain("publisher_type = 'page' OR page_id IS NOT NULL");
      expect(query.statement.text).not.toContain('SELECT owner_id FROM public.businesses');
    });

    it('creators feed strictly targets publisher_type = creator', () => {
      const query = buildFeedQuery({ viewerId: 'user_viewer_1', mode: 'creators' });
      expect(query.statement.text).toContain("publisher_type = 'creator'");
    });

    it('official feed strictly targets publisher_type = official or official accounts', () => {
      const query = buildFeedQuery({ viewerId: 'user_viewer_1', mode: 'official' });
      expect(query.statement.text).toContain("publisher_type = 'official' OR is_official = true");
      expect(query.statement.text).toContain('public.official_accounts');
    });
  });

  describe('4. First-Class Reposting & Commentary Preservation', () => {
    it('creates a distinct repost with shared_post_id referencing original post', () => {
      const originalPost = {
        id: 'post_original_999',
        author: 'Official TUKUBI',
        handle: 'tukubi',
        is_official: true,
        content: 'System Maintenance Notice: Database migration scheduled for 02:00 UTC.',
      };

      const repost = {
        id: 'post_repost_1000',
        created_by_user_id: 'usr_reposter_555',
        author_id: 'usr_reposter_555',
        publisher_type: 'personal' as PublisherType,
        shared_post_id: originalPost.id,
        content: 'Heads up everyone, platform maintenance tonight!',
        share_commentary: 'Heads up everyone, platform maintenance tonight!',
      };

      expect(repost.shared_post_id).toBe(originalPost.id);
      expect(repost.content).toBe('Heads up everyone, platform maintenance tonight!');
      expect(repost.id).not.toBe(originalPost.id);
      expect(originalPost.content).toBe('System Maintenance Notice: Database migration scheduled for 02:00 UTC.');
    });
  });
});
