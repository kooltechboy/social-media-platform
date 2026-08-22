export type CommunityJoinPolicy = 'public' | 'private' | 'invite_only';

export type CommunityRoleName = 'owner' | 'moderator' | 'member';

export type CommunityPermission =
  | 'post' | 'moderate' | 'invite' | 'edit_settings' | 'remove_member' | 'manage_roles';

export interface CommunityRoleCapabilities {
  name: CommunityRoleName;
  permissions: CommunityPermission[];
}

export const ROLE_CAPABILITIES: Record<CommunityRoleName, CommunityRoleCapabilities> = {
  owner: {
    name: 'owner',
    permissions: ['post', 'moderate', 'invite', 'edit_settings', 'remove_member', 'manage_roles'],
  },
  moderator: {
    name: 'moderator',
    permissions: ['post', 'moderate', 'invite', 'remove_member'],
  },
  member: {
    name: 'member',
    permissions: ['post'],
  },
};

export const ROLE_HIERARCHY: Record<CommunityRoleName, number> = {
  owner: 3,
  moderator: 2,
  member: 1,
};

export interface MembershipContext {
  profileId: string;
  roleName: CommunityRoleName | null;
  membershipStatus: 'active' | 'banned' | 'pending' | null;
}

export class CommunityPolicy {
  public canJoin(policy: CommunityJoinPolicy, context: { hasInvite: boolean }): { allowed: boolean; reason?: string } {
    switch (policy) {
      case 'public':
        return { allowed: true };
      case 'private':
        return context.hasInvite
          ? { allowed: true }
          : { allowed: false, reason: 'This community requires an invitation.' };
      case 'invite_only':
        return context.hasInvite
          ? { allowed: true }
          : { allowed: false, reason: 'This community is invite-only.' };
      default:
        return { allowed: false, reason: 'Unknown join policy.' };
    }
  }

  public hasPermission(context: MembershipContext, permission: CommunityPermission): boolean {
    if (context.membershipStatus !== 'active' || !context.roleName) {
      return false;
    }
    return ROLE_CAPABILITIES[context.roleName].permissions.includes(permission);
  }

  public canActOnActor(actor: MembershipContext, target: MembershipContext): boolean {
    if (!this.hasPermission(actor, 'remove_member')) return false;
    if (actor.roleName === 'owner') return true;
    if (!actor.roleName || !target.roleName) return false;
    return ROLE_HIERARCHY[actor.roleName] > ROLE_HIERARCHY[target.roleName];
  }

  public canViewContent(policy: CommunityJoinPolicy, context: MembershipContext): boolean {
    if (policy === 'public') return true;
    return context.membershipStatus === 'active';
  }

  public slugify(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }
}
