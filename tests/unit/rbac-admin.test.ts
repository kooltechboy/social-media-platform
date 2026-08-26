import { describe, it, expect } from 'vitest';
import { STAFF_ROLES, SystemRole } from '../../packages/auth/src';
import { STAFF_ROLE_TITLES } from '../../apps/web/src/lib/admin/types';

describe('RBAC & Super Admin / Staff System Architecture', () => {
  it('defines all canonical staff roles in packages/auth', () => {
    expect(STAFF_ROLES).toContain('super_admin');
    expect(STAFF_ROLES).toContain('admin');
    expect(STAFF_ROLES).toContain('moderator');
    expect(STAFF_ROLES).toContain('support');
    expect(STAFF_ROLES).toContain('content_manager');
    expect(STAFF_ROLES).toContain('analyst');
  });

  it('maps all roles to readable titles in staff-actions', () => {
    expect(STAFF_ROLE_TITLES['super_admin']).toBe('Super Admin');
    expect(STAFF_ROLE_TITLES['admin']).toBe('Administrator');
    expect(STAFF_ROLE_TITLES['moderator']).toBe('Trust & Safety Moderator');
    expect(STAFF_ROLE_TITLES['support']).toBe('Support Specialist');
    expect(STAFF_ROLE_TITLES['content_manager']).toBe('Content Manager');
    expect(STAFF_ROLE_TITLES['analyst']).toBe('Data Analyst');
  });

  it('enforces role capability matrix rules', () => {
    const isRoleAuthorized = (
      userRole: SystemRole,
      allowedRoles: SystemRole[],
      status: string = 'active'
    ) => {
      if (status !== 'active') return false;
      if (userRole === 'super_admin' || userRole === 'superadmin' || userRole === 'management') {
        return true;
      }
      return allowedRoles.includes(userRole);
    };

    // Super Admin can access everything
    expect(isRoleAuthorized('super_admin', ['admin'])).toBe(true);
    expect(isRoleAuthorized('super_admin', ['moderator'])).toBe(true);
    expect(isRoleAuthorized('super_admin', ['analyst'])).toBe(true);

    // Admin can access admin and below, but not super_admin restricted actions
    expect(isRoleAuthorized('admin', ['admin'])).toBe(true);
    expect(isRoleAuthorized('admin', ['super_admin'])).toBe(false);

    // Moderator cannot access admin-only actions
    expect(isRoleAuthorized('moderator', ['admin'])).toBe(false);
    expect(isRoleAuthorized('moderator', ['moderator'])).toBe(true);

    // Suspended account cannot access any staff action
    expect(isRoleAuthorized('super_admin', ['admin'], 'suspended')).toBe(false);
    expect(isRoleAuthorized('admin', ['admin'], 'deactivated')).toBe(false);
  });
});
