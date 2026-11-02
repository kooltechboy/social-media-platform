import { describe, it, expect } from 'vitest';
import {
  CommunityPolicy,
  ROLE_CAPABILITIES,
  ROLE_HIERARCHY,
  type CommunityRoleName,
  type MembershipContext,
} from '../packages/communities/src/index';
import {
  isValidProductContext,
  isValidOrderContext,
  type ProductContextPayload,
  type OrderContextPayload,
} from '../packages/messaging/src/index';

describe('Phase 5: Messaging, Realtime Presence & Diaspora Communities Suite', () => {
  const policy = new CommunityPolicy();

  // =========================================================================
  // 1. Community Governance & Role Hierarchy Invariants
  // =========================================================================
  describe('1. Community Governance & Role Hierarchy', () => {
    it('properly enforces role hierarchy: owner > admin > moderator > member', () => {
      expect(ROLE_HIERARCHY['owner']).toBeGreaterThan(ROLE_HIERARCHY['moderator']);
      expect(ROLE_HIERARCHY['moderator']).toBeGreaterThan(ROLE_HIERARCHY['member']);
      if ('admin' in ROLE_HIERARCHY) {
        expect((ROLE_HIERARCHY as any)['admin']).toBeGreaterThan(ROLE_HIERARCHY['moderator']);
        expect(ROLE_HIERARCHY['owner']).toBeGreaterThan((ROLE_HIERARCHY as any)['admin']);
      }
    });

    it('only allows owners to transfer ownership', () => {
      const ownerCtx: MembershipContext = { profileId: 'usr_owner', roleName: 'owner', membershipStatus: 'active' };
      const modCtx: MembershipContext = { profileId: 'usr_mod', roleName: 'moderator', membershipStatus: 'active' };
      const memberCtx: MembershipContext = { profileId: 'usr_mem', roleName: 'member', membershipStatus: 'active' };

      expect((policy as any).canTransferOwnership(ownerCtx)).toBe(true);
      expect((policy as any).canTransferOwnership(modCtx)).toBe(false);
      expect((policy as any).canTransferOwnership(memberCtx)).toBe(false);
    });

    it('allows owners and moderators to pin posts, but denies ordinary members', () => {
      const ownerCtx: MembershipContext = { profileId: 'usr_owner', roleName: 'owner', membershipStatus: 'active' };
      const modCtx: MembershipContext = { profileId: 'usr_mod', roleName: 'moderator', membershipStatus: 'active' };
      const memberCtx: MembershipContext = { profileId: 'usr_mem', roleName: 'member', membershipStatus: 'active' };

      expect(policy.hasPermission(ownerCtx, 'pin_post' as any)).toBe(true);
      expect(policy.hasPermission(modCtx, 'pin_post' as any)).toBe(true);
      expect(policy.hasPermission(memberCtx, 'pin_post' as any)).toBe(false);
    });

    it('strictly prevents moderators from removing or acting upon owners', () => {
      const ownerCtx: MembershipContext = { profileId: 'usr_owner', roleName: 'owner', membershipStatus: 'active' };
      const modCtx: MembershipContext = { profileId: 'usr_mod', roleName: 'moderator', membershipStatus: 'active' };

      // Moderator cannot remove Owner
      expect(policy.canActOnActor(modCtx, ownerCtx)).toBe(false);
      // Owner can remove Moderator
      expect(policy.canActOnActor(ownerCtx, modCtx)).toBe(true);
    });
  });

  // =========================================================================
  // 2. Conversational Commerce Context Card Validators
  // =========================================================================
  describe('2. Conversational Commerce Card Validators', () => {
    it('validates a well-formed ProductContextPayload', () => {
      const validProduct: ProductContextPayload = {
        productId: 'prod_rum_cake_01',
        title: 'Authentic Jamaican Black Rum Cake',
        priceMinor: 3500,
        currency: 'USD',
        listingUrl: 'https://www.tukubi.com/marketplace/prod_rum_cake_01',
      };

      expect(isValidProductContext(validProduct)).toBe(true);
    });

    it('rejects invalid ProductContextPayload missing required fields or negative price', () => {
      expect(isValidProductContext(null)).toBe(false);
      expect(isValidProductContext({})).toBe(false);
      expect(
        isValidProductContext({
          productId: 'prod_1',
          title: 'Cake',
          priceMinor: -500, // Negative!
          currency: 'USD',
          listingUrl: '/marketplace/p1',
        })
      ).toBe(false);
    });

    it('validates a well-formed OrderContextPayload', () => {
      const validOrder: OrderContextPayload = {
        orderId: 'ord_123',
        orderNumber: 'TK-2026-9876',
        totalMinor: 7500,
        currency: 'USD',
        status: 'confirmed',
        orderUrl: 'https://www.tukubi.com/orders/ord_123',
      };

      expect(isValidOrderContext(validOrder)).toBe(true);
    });

    it('rejects OrderContextPayload with invalid status or non-integer total', () => {
      expect(
        isValidOrderContext({
          orderId: 'ord_123',
          orderNumber: 'TK-1',
          totalMinor: 75.5, // Not integer!
          currency: 'USD',
          status: 'confirmed',
          orderUrl: '/orders/1',
        })
      ).toBe(false);

      expect(
        isValidOrderContext({
          orderId: 'ord_123',
          orderNumber: 'TK-1',
          totalMinor: 7500,
          currency: 'USD',
          status: 'unknown_status' as any, // Invalid status!
          orderUrl: '/orders/1',
        })
      ).toBe(false);
    });
  });
});
