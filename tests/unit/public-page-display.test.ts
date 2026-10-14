import { describe, it, expect } from 'vitest';

describe('TUKUBI Public Page Display & Image Resolution', () => {
  function resolvePageVisuals(page: {
    avatar_url?: string | null;
    logo_url?: string | null;
    cover_image_url?: string | null;
    cover_url?: string | null;
  }) {
    const avatarUrl = page.avatar_url || page.logo_url || null;
    const bannerUrl = page.cover_image_url || page.cover_url || null;

    return {
      avatarUrl,
      bannerUrl,
      hasAvatar: Boolean(avatarUrl),
      hasBanner: Boolean(bannerUrl),
      avatarFallback: avatarUrl ? null : '🌴',
    };
  }

  function getPageManagementLinks(slug: string, canManage: boolean) {
    if (!canManage) return null;
    return {
      manageDashboard: `/pages/${slug}/manage`,
      editProfileTab: `/pages/${slug}/manage?tab=edit`,
      editRolesTab: `/pages/${slug}/manage?tab=roles`,
    };
  }

  it('correctly resolves avatar from either avatar_url or legacy logo_url', () => {
    const caseA = resolvePageVisuals({ avatar_url: 'https://cdn.tukubi.com/avatars/page1.webp' });
    expect(caseA.avatarUrl).toBe('https://cdn.tukubi.com/avatars/page1.webp');
    expect(caseA.hasAvatar).toBe(true);

    const caseB = resolvePageVisuals({ logo_url: 'https://cdn.tukubi.com/avatars/legacy.webp' });
    expect(caseB.avatarUrl).toBe('https://cdn.tukubi.com/avatars/legacy.webp');
    expect(caseB.hasAvatar).toBe(true);

    const caseC = resolvePageVisuals({});
    expect(caseC.avatarUrl).toBeNull();
    expect(caseC.hasAvatar).toBe(false);
    expect(caseC.avatarFallback).toBe('🌴');
  });

  it('correctly resolves banner from either cover_image_url or legacy cover_url', () => {
    const caseA = resolvePageVisuals({ cover_image_url: 'https://cdn.tukubi.com/banners/hero.webp' });
    expect(caseA.bannerUrl).toBe('https://cdn.tukubi.com/banners/hero.webp');
    expect(caseA.hasBanner).toBe(true);

    const caseB = resolvePageVisuals({ cover_url: 'https://cdn.tukubi.com/banners/hero2.webp' });
    expect(caseB.bannerUrl).toBe('https://cdn.tukubi.com/banners/hero2.webp');
    expect(caseB.hasBanner).toBe(true);

    const caseC = resolvePageVisuals({});
    expect(caseC.bannerUrl).toBeNull();
    expect(caseC.hasBanner).toBe(false);
  });

  it('generates direct deep-links to edit experience for authorized managers', () => {
    const managerLinks = getPageManagementLinks('kool-tech', true);
    expect(managerLinks).toBeDefined();
    expect(managerLinks?.manageDashboard).toBe('/pages/kool-tech/manage');
    expect(managerLinks?.editProfileTab).toBe('/pages/kool-tech/manage?tab=edit');
    expect(managerLinks?.editRolesTab).toBe('/pages/kool-tech/manage?tab=roles');

    const visitorLinks = getPageManagementLinks('kool-tech', false);
    expect(visitorLinks).toBeNull();
  });
});
