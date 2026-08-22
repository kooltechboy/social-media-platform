import { describe, it, expect } from 'vitest';
import { CommunityPolicy, ROLE_CAPABILITIES, ROLE_HIERARCHY } from '../../packages/communities/src/index';

describe('Community join policy', () => {
  const policy = new CommunityPolicy();

  it('lets anyone join public communities', () => {
    expect(policy.canJoin('public', { hasInvite: false }).allowed).toBe(true);
  });

  it('requires invitations for private and invite-only communities', () => {
    expect(policy.canJoin('private', { hasInvite: false }).allowed).toBe(false);
    expect(policy.canJoin('private', { hasInvite: true }).allowed).toBe(true);
    expect(policy.canJoin('invite_only', { hasInvite: false }).reason).toContain('invite-only');
  });
});

describe('Community permissions and hierarchy', () => {
  const policy = new CommunityPolicy();
  const owner = { profileId: 'u1', roleName: 'owner' as const, membershipStatus: 'active' as const };
  const moderator = { profileId: 'u2', roleName: 'moderator' as const, membershipStatus: 'active' as const };
  const member = { profileId: 'u3', roleName: 'member' as const, membershipStatus: 'active' as const };
  const banned = { profileId: 'u4', roleName: 'member' as const, membershipStatus: 'banned' as const };

  it('assigns permissions by role', () => {
    expect(policy.hasPermission(member, 'post')).toBe(true);
    expect(policy.hasPermission(member, 'moderate')).toBe(false);
    expect(policy.hasPermission(moderator, 'moderate')).toBe(true);
    expect(policy.hasPermission(owner, 'manage_roles')).toBe(true);
    expect(policy.hasPermission(banned, 'post')).toBe(false);
  });

  it('enforces hierarchy for member removal', () => {
    expect(policy.canActOnActor(moderator, member)).toBe(true);
    expect(policy.canActOnActor(member, moderator)).toBe(false);
    expect(policy.canActOnActor(moderator, owner)).toBe(false);
    expect(policy.canActOnActor(owner, moderator)).toBe(true);
  });

  it('hides private community content from non-members', () => {
    const outsider = { profileId: 'u9', roleName: null, membershipStatus: null };
    expect(policy.canViewContent('private', outsider)).toBe(false);
    expect(policy.canViewContent('private', member)).toBe(true);
    expect(policy.canViewContent('public', outsider)).toBe(true);
  });

  it('slugifies community names safely', () => {
    expect(policy.slugify('Jamaicans in Toronto!')).toBe('jamaicans-in-toronto');
    expect(policy.slugify('Café Sóca')).toBe('cafe-soca');
  });

  it('keeps the role capability map coherent with the hierarchy', () => {
    expect(ROLE_HIERARCHY.owner).toBeGreaterThan(ROLE_HIERARCHY.moderator);
    expect(ROLE_HIERARCHY.moderator).toBeGreaterThan(ROLE_HIERARCHY.member);
    expect(ROLE_CAPABILITIES.owner.permissions.length).toBeGreaterThan(ROLE_CAPABILITIES.member.permissions.length);
  });
});
