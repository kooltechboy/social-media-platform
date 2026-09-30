import { describe, it, expect } from 'vitest';
import {
  CommunityPolicy,
  ROLE_CAPABILITIES,
  ROLE_HIERARCHY,
  CommunityJoinPolicy,
  CommunityRoleName,
  MembershipContext,
} from '../../packages/communities/src/index';

describe('Phase 16 — Communities, Hubs & Governance Certification', () => {
  const policy = new CommunityPolicy();

  // ===========================================================================
  // 1. Join Policies & Admission Gate
  // ===========================================================================
  describe('1. Join Policies & Admission Invariants', () => {
    it('grants open admission to public Caribbean community hubs', () => {
      expect(policy.canJoin('public', { hasInvite: false }).allowed).toBe(true);
      expect(policy.canJoin('public', { hasInvite: true }).allowed).toBe(true);
    });

    it('requires an invitation or prior authorization for private communities', () => {
      const withoutInvite = policy.canJoin('private', { hasInvite: false });
      expect(withoutInvite.allowed).toBe(false);
      expect(withoutInvite.reason).toContain('requires an invitation');

      const withInvite = policy.canJoin('private', { hasInvite: true });
      expect(withInvite.allowed).toBe(true);
    });

    it('enforces invite-only membership for exclusive diaspora hubs', () => {
      const withoutInvite = policy.canJoin('invite_only', { hasInvite: false });
      expect(withoutInvite.allowed).toBe(false);
      expect(withoutInvite.reason).toContain('invite-only');

      const withInvite = policy.canJoin('invite_only', { hasInvite: true });
      expect(withInvite.allowed).toBe(true);
    });
  });

  // ===========================================================================
  // 2. Role Hierarchies & Moderation Governance
  // ===========================================================================
  describe('2. Role Permissions & Moderation Hierarchy', () => {
    const ownerCtx: MembershipContext = { profileId: 'u_owner', roleName: 'owner', membershipStatus: 'active' };
    const modCtx: MembershipContext = { profileId: 'u_mod', roleName: 'moderator', membershipStatus: 'active' };
    const memberCtx: MembershipContext = { profileId: 'u_mem', roleName: 'member', membershipStatus: 'active' };
    const bannedCtx: MembershipContext = { profileId: 'u_ban', roleName: 'member', membershipStatus: 'banned' };

    it('allocates permissions according to role capability matrix', () => {
      // Members can only post
      expect(policy.hasPermission(memberCtx, 'post')).toBe(true);
      expect(policy.hasPermission(memberCtx, 'moderate')).toBe(false);
      expect(policy.hasPermission(memberCtx, 'remove_member')).toBe(false);

      // Moderators can post, moderate, invite, remove members
      expect(policy.hasPermission(modCtx, 'post')).toBe(true);
      expect(policy.hasPermission(modCtx, 'moderate')).toBe(true);
      expect(policy.hasPermission(modCtx, 'remove_member')).toBe(true);
      expect(policy.hasPermission(modCtx, 'manage_roles')).toBe(false);

      // Owners have full administrative permissions
      expect(policy.hasPermission(ownerCtx, 'edit_settings')).toBe(true);
      expect(policy.hasPermission(ownerCtx, 'manage_roles')).toBe(true);
    });

    it('strictly forbids banned users from performing any actions', () => {
      expect(policy.hasPermission(bannedCtx, 'post')).toBe(false);
      expect(policy.hasPermission(bannedCtx, 'invite')).toBe(false);
    });

    it('enforces strict vertical moderation hierarchy (cannot act on superiors or peers)', () => {
      // Owner can moderate moderators and members
      expect(policy.canActOnActor(ownerCtx, modCtx)).toBe(true);
      expect(policy.canActOnActor(ownerCtx, memberCtx)).toBe(true);

      // Moderator can act on members, but NOT on fellow moderators or the owner
      expect(policy.canActOnActor(modCtx, memberCtx)).toBe(true);
      expect(policy.canActOnActor(modCtx, modCtx)).toBe(false);
      expect(policy.canActOnActor(modCtx, ownerCtx)).toBe(false);

      // Members cannot act on anyone
      expect(policy.canActOnActor(memberCtx, memberCtx)).toBe(false);
      expect(policy.canActOnActor(memberCtx, modCtx)).toBe(false);
    });

    it('hides private community content from non-members and unauthenticated visitors', () => {
      const nonMember: MembershipContext = { profileId: 'u_visitor', roleName: null, membershipStatus: null };

      expect(policy.canViewContent('private', nonMember)).toBe(false);
      expect(policy.canViewContent('invite_only', nonMember)).toBe(false);
      expect(policy.canViewContent('public', nonMember)).toBe(true);

      expect(policy.canViewContent('private', memberCtx)).toBe(true);
      expect(policy.canViewContent('private', bannedCtx)).toBe(false);
    });
  });

  // ===========================================================================
  // 3. Slugification & SEO Navigation Safety
  // ===========================================================================
  describe('3. Slugification & Navigation Invariants', () => {
    it('produces safe URL slugs stripped of diacritics and special characters', () => {
      expect(policy.slugify('Caribbean Tech & Founders Hub!')).toBe('caribbean-tech-founders-hub');
      expect(policy.slugify('Carnaval de Martinique 2026')).toBe('carnaval-de-martinique-2026');
      expect(policy.slugify('Café y Música Cubana')).toBe('cafe-y-musica-cubana');
    });

    it('clamps slug length to 80 characters', () => {
      const longName = 'A'.repeat(120);
      expect(policy.slugify(longName).length).toBeLessThanOrEqual(80);
    });
  });
});
