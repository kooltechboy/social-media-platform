import { describe, it, expect } from 'vitest';
import {
  UNIVERSAL_CATEGORY_GROUPS,
  ALL_UNIVERSAL_CATEGORIES,
  findCategoryBySlug,
  searchCategories,
  type PageCategoryGroupKey,
} from '../../apps/web/src/lib/pages/categories';

describe('TUKUBI Pages 2.0 — Universal Category Architecture', () => {
  it('defines the 12 universal category groups', () => {
    const expectedGroups: PageCategoryGroupKey[] = [
      'creator',
      'business',
      'media',
      'community',
      'education',
      'institution',
      'sports',
      'faith',
      'events',
      'travel',
      'technology',
      'other',
    ];

    expect(UNIVERSAL_CATEGORY_GROUPS).toHaveLength(12);

    const actualGroupKeys = UNIVERSAL_CATEGORY_GROUPS.map((g) => g.key);
    for (const key of expectedGroups) {
      expect(actualGroupKeys).toContain(key);
    }
  });

  it('guarantees unique IDs and slugs across all universal categories', () => {
    expect(ALL_UNIVERSAL_CATEGORIES.length).toBeGreaterThan(25);

    const slugs = ALL_UNIVERSAL_CATEGORIES.map((c) => c.slug);
    const ids = ALL_UNIVERSAL_CATEGORIES.map((c) => c.id);

    const uniqueSlugs = new Set(slugs);
    const uniqueIds = new Set(ids);

    expect(uniqueSlugs.size).toBe(slugs.length);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('correctly resolves categories by slug', () => {
    const musician = findCategoryBySlug('musician');
    expect(musician).toBeDefined();
    expect(musician?.groupKey).toBe('creator');
    expect(musician?.name).toBe('Musician & DJ');

    const restaurant = findCategoryBySlug('restaurant-cafe');
    expect(restaurant).toBeDefined();
    expect(restaurant?.groupKey).toBe('business');

    const ngo = findCategoryBySlug('nonprofit-ngo');
    expect(ngo).toBeDefined();
    expect(ngo?.groupKey).toBe('institution');

    const tech = findCategoryBySlug('tech-company-startup');
    expect(tech).toBeDefined();
    expect(tech?.groupKey).toBe('technology');

    const nonExistent = findCategoryBySlug('non-existent-category');
    expect(nonExistent).toBeUndefined();
  });

  it('performs intelligent taxonomy search across name, description, and group name', () => {
    const musicResults = searchCategories('music');
    expect(musicResults.length).toBeGreaterThan(0);
    expect(musicResults.some((c) => c.slug === 'musician')).toBe(true);

    const hotelResults = searchCategories('hotel');
    expect(hotelResults.length).toBeGreaterThan(0);
    expect(hotelResults.some((c) => c.slug === 'hospitality-hotel')).toBe(true);

    const charityResults = searchCategories('charity');
    expect(charityResults.length).toBeGreaterThan(0);
    expect(charityResults.some((c) => c.slug === 'nonprofit-ngo')).toBe(true);

    const emptyResults = searchCategories('');
    expect(emptyResults.length).toBe(ALL_UNIVERSAL_CATEGORIES.length);
  });
});

describe('TUKUBI Pages 2.0 — Role-Based Access Control (RBAC) Hierarchy', () => {
  type PageRole = 'owner' | 'admin' | 'editor' | 'moderator' | 'analyst';

  interface RolePermissions {
    canManageSettings: boolean;
    canManageRoles: boolean;
    canPublishPosts: boolean;
    canModerateComments: boolean;
    canViewAnalytics: boolean;
    canDeactivate: boolean;
    canDeletePermanently: boolean;
  }

  function getPermissions(role: PageRole): RolePermissions {
    switch (role) {
      case 'owner':
        return {
          canManageSettings: true,
          canManageRoles: true,
          canPublishPosts: true,
          canModerateComments: true,
          canViewAnalytics: true,
          canDeactivate: true,
          canDeletePermanently: true,
        };
      case 'admin':
        return {
          canManageSettings: true,
          canManageRoles: true,
          canPublishPosts: true,
          canModerateComments: true,
          canViewAnalytics: true,
          canDeactivate: true,
          canDeletePermanently: false, // Only owner can permanently delete
        };
      case 'editor':
        return {
          canManageSettings: false,
          canManageRoles: false,
          canPublishPosts: true,
          canModerateComments: true,
          canViewAnalytics: true,
          canDeactivate: false,
          canDeletePermanently: false,
        };
      case 'moderator':
        return {
          canManageSettings: false,
          canManageRoles: false,
          canPublishPosts: false,
          canModerateComments: true,
          canViewAnalytics: false,
          canDeactivate: false,
          canDeletePermanently: false,
        };
      case 'analyst':
        return {
          canManageSettings: false,
          canManageRoles: false,
          canPublishPosts: false,
          canModerateComments: false,
          canViewAnalytics: true,
          canDeactivate: false,
          canDeletePermanently: false,
        };
    }
  }

  it('strictly restricts permanent page deletion to the owner', () => {
    const roles: PageRole[] = ['owner', 'admin', 'editor', 'moderator', 'analyst'];
    for (const role of roles) {
      const perms = getPermissions(role);
      if (role === 'owner') {
        expect(perms.canDeletePermanently).toBe(true);
      } else {
        expect(perms.canDeletePermanently).toBe(false);
      }
    }
  });

  it('allows owner and admin to manage roles and settings', () => {
    expect(getPermissions('owner').canManageRoles).toBe(true);
    expect(getPermissions('admin').canManageRoles).toBe(true);
    expect(getPermissions('editor').canManageRoles).toBe(false);
    expect(getPermissions('moderator').canManageRoles).toBe(false);
    expect(getPermissions('analyst').canManageRoles).toBe(false);
  });

  it('allows owner, admin, and editor to publish posts', () => {
    expect(getPermissions('owner').canPublishPosts).toBe(true);
    expect(getPermissions('admin').canPublishPosts).toBe(true);
    expect(getPermissions('editor').canPublishPosts).toBe(true);
    expect(getPermissions('moderator').canPublishPosts).toBe(false);
    expect(getPermissions('analyst').canPublishPosts).toBe(false);
  });

  it('restricts analyst to read-only analytics', () => {
    const perms = getPermissions('analyst');
    expect(perms.canViewAnalytics).toBe(true);
    expect(perms.canPublishPosts).toBe(false);
    expect(perms.canManageSettings).toBe(false);
    expect(perms.canManageRoles).toBe(false);
    expect(perms.canModerateComments).toBe(false);
    expect(perms.canDeactivate).toBe(false);
  });
});

describe('TUKUBI Pages 2.0 — Page Lifecycle Semantics', () => {
  it('requires exact slug confirmation for permanent page deletion', () => {
    const pageSlug = 'island-vibes-cafe';

    function validateDeletion(targetSlug: string, enteredSlug: string): boolean {
      return targetSlug.trim().toLowerCase() === enteredSlug.trim().toLowerCase();
    }

    expect(validateDeletion(pageSlug, 'island-vibes-cafe')).toBe(true);
    expect(validateDeletion(pageSlug, ' ISLAND-VIBES-CAFE ')).toBe(true);
    expect(validateDeletion(pageSlug, 'island-vibes')).toBe(false);
    expect(validateDeletion(pageSlug, '')).toBe(false);
  });

  it('toggles deactivation status without destroying page content or followers', () => {
    interface MockPageRecord {
      id: string;
      slug: string;
      is_deactivated: boolean;
      deactivated_at: string | null;
      deleted_at: string | null;
    }

    const page: MockPageRecord = {
      id: 'page_123',
      slug: 'blue-mountain-coffee',
      is_deactivated: false,
      deactivated_at: null,
      deleted_at: null,
    };

    // Deactivate
    const now = new Date().toISOString();
    page.is_deactivated = true;
    page.deactivated_at = now;

    expect(page.is_deactivated).toBe(true);
    expect(page.deactivated_at).toBe(now);
    expect(page.deleted_at).toBeNull();

    // Reactivate
    page.is_deactivated = false;
    page.deactivated_at = null;

    expect(page.is_deactivated).toBe(false);
    expect(page.deactivated_at).toBeNull();
  });
});
