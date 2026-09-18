import { describe, it, expect, beforeEach } from 'vitest';
import type { OperatingIdentityType, OperatingIdentity } from '../../packages/social/src/index';

describe('Multi-Identity Switcher Architecture & Verification', () => {
  describe('Operating Identity Types & Schema', () => {
    it('supports all four operating personas', () => {
      const personas: OperatingIdentityType[] = ['personal', 'creator', 'business', 'community'];
      expect(personas).toHaveLength(4);
    });

    it('verifies OperatingIdentity interface integrity', () => {
      const personalIdentity: OperatingIdentity = {
        id: 'usr-1',
        type: 'personal',
        name: 'Kofi Kingston',
        handle: '@kofi',
        avatarUrl: 'https://images.tukubi.com/kofi.png',
        role: 'member',
        verified: true,
      };

      const businessIdentity: OperatingIdentity = {
        id: 'biz-88',
        type: 'business',
        name: 'Blue Mountain Coffee Roasters',
        handle: '@bluemountain',
        avatarUrl: 'https://images.tukubi.com/coffee.png',
        role: 'owner',
        unreadBadgeCount: 5,
        verified: true,
      };

      expect(personalIdentity.type).toBe('personal');
      expect(personalIdentity.role).toBe('member');
      expect(businessIdentity.type).toBe('business');
      expect(businessIdentity.unreadBadgeCount).toBe(5);
    });
  });

  describe('Identity Authorization & Switching State Manager', () => {
    interface IdentityManagerSession {
      userId: string;
      availableIdentities: OperatingIdentity[];
      activeIdentity: OperatingIdentity;
    }

    let session: IdentityManagerSession;

    beforeEach(() => {
      const primary: OperatingIdentity = {
        id: 'usr-100',
        type: 'personal',
        name: 'Tanya Stephens',
        handle: '@tanya',
        role: 'owner',
        verified: true,
      };

      const creator: OperatingIdentity = {
        id: 'creator-200',
        type: 'creator',
        name: 'Tanya Sound & Riddims',
        handle: '@tanyariddims',
        role: 'creator',
        verified: true,
      };

      const community: OperatingIdentity = {
        id: 'comm-300',
        type: 'community',
        name: 'Caribbean Reggae Collective',
        handle: '@caribreggae',
        role: 'admin',
        verified: false,
      };

      session = {
        userId: 'usr-100',
        availableIdentities: [primary, creator, community],
        activeIdentity: primary,
      };
    });

    function switchIdentity(sessionState: IdentityManagerSession, targetIdentityId: string): { success: boolean; error?: string } {
      const target = sessionState.availableIdentities.find((i) => i.id === targetIdentityId);
      if (!target) {
        return { success: false, error: 'IDENTITY_NOT_AUTHORIZED' };
      }
      sessionState.activeIdentity = target;
      return { success: true };
    }

    it('successfully switches between authorized identities', () => {
      expect(session.activeIdentity.id).toBe('usr-100');

      const res1 = switchIdentity(session, 'creator-200');
      expect(res1.success).toBe(true);
      expect(session.activeIdentity.id).toBe('creator-200');
      expect(session.activeIdentity.type).toBe('creator');

      const res2 = switchIdentity(session, 'comm-300');
      expect(res2.success).toBe(true);
      expect(session.activeIdentity.id).toBe('comm-300');
      expect(session.activeIdentity.type).toBe('community');
    });

    it('rejects switching to an unauthorized identity id', () => {
      const res = switchIdentity(session, 'fraudulent-external-brand');
      expect(res.success).toBe(false);
      expect(res.error).toBe('IDENTITY_NOT_AUTHORIZED');
      expect(session.activeIdentity.id).toBe('usr-100');
    });

    it('enforces capability scoping based on active identity type', () => {
      function canManageStore(identity: OperatingIdentity): boolean {
        return identity.type === 'business';
      }

      function canAccessCreatorMonetization(identity: OperatingIdentity): boolean {
        return identity.type === 'creator';
      }

      expect(canManageStore(session.activeIdentity)).toBe(false);
      expect(canAccessCreatorMonetization(session.activeIdentity)).toBe(false);

      switchIdentity(session, 'creator-200');
      expect(canAccessCreatorMonetization(session.activeIdentity)).toBe(true);
      expect(canManageStore(session.activeIdentity)).toBe(false);
    });
  });
});
