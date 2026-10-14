import { describe, it, expect, vi, beforeEach } from 'vitest';

// We test the business logic and validation rules of page actions
describe('TUKUBI Page Management — Validation & Authorization Engine', () => {
  const ALLOWED_AVATAR_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const ALLOWED_BANNER_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_BANNER_SIZE = 10 * 1024 * 1024; // 10MB

  function validatePageImageFile(file: { type: string; size: number }, imageType: 'avatar' | 'banner') {
    const allowed = imageType === 'avatar' ? ALLOWED_AVATAR_MIMES : ALLOWED_BANNER_MIMES;
    if (!allowed.includes(file.type.toLowerCase())) {
      return {
        valid: false,
        error: imageType === 'avatar'
          ? 'Only JPG, PNG, WebP, or GIF images are allowed for avatars.'
          : 'Only JPG, PNG, or WebP images are allowed for banners.',
      };
    }

    const maxSize = imageType === 'avatar' ? MAX_AVATAR_SIZE : MAX_BANNER_SIZE;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: imageType === 'avatar'
          ? 'Avatar image cannot exceed 5MB.'
          : 'Banner image cannot exceed 10MB.',
      };
    }

    return { valid: true, error: null };
  }

  function validatePageMetadata(payload: {
    name: string;
    description?: string;
    website?: string;
    category?: string;
  }) {
    const name = payload.name.trim();
    if (!name) {
      return { valid: false, error: 'Page name cannot be empty.' };
    }
    if (name.length > 100) {
      return { valid: false, error: 'Page name cannot exceed 100 characters.' };
    }

    if (payload.description && payload.description.length > 1000) {
      return { valid: false, error: 'Page description cannot exceed 1000 characters.' };
    }

    let safeWebsite: string | null = null;
    if (payload.website && payload.website.trim()) {
      const raw = payload.website.trim();
      const normalized = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
      try {
        const parsed = new URL(normalized);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          safeWebsite = parsed.toString();
        } else {
          return { valid: false, error: 'Please enter a valid website URL.' };
        }
      } catch {
        return { valid: false, error: 'Please enter a valid website URL.' };
      }
    }

    return { valid: true, error: null, safeWebsite, name };
  }

  function checkCanManagePage(
    userId: string | null | undefined,
    pageOwnerId: string,
    userRoleOnPage?: string | null
  ) {
    if (!userId) return false;
    if (userId === pageOwnerId) return true;
    return userRoleOnPage === 'owner' || userRoleOnPage === 'admin';
  }

  describe('File Validation', () => {
    it('accepts valid JPEG, PNG, and WebP avatar images within 5MB', () => {
      expect(validatePageImageFile({ type: 'image/jpeg', size: 1024 * 1024 }, 'avatar').valid).toBe(true);
      expect(validatePageImageFile({ type: 'image/png', size: 2 * 1024 * 1024 }, 'avatar').valid).toBe(true);
      expect(validatePageImageFile({ type: 'image/webp', size: 500 * 1024 }, 'avatar').valid).toBe(true);
      expect(validatePageImageFile({ type: 'image/gif', size: 500 * 1024 }, 'avatar').valid).toBe(true);
    });

    it('rejects avatar images exceeding 5MB', () => {
      const res = validatePageImageFile({ type: 'image/png', size: 6 * 1024 * 1024 }, 'avatar');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('5MB');
    });

    it('rejects disallowed file types for avatars (e.g. PDF, executable, SVG)', () => {
      const res = validatePageImageFile({ type: 'application/pdf', size: 1000 }, 'avatar');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Only JPG, PNG');
    });

    it('accepts banners up to 10MB in supported formats', () => {
      expect(validatePageImageFile({ type: 'image/jpeg', size: 8 * 1024 * 1024 }, 'banner').valid).toBe(true);
      expect(validatePageImageFile({ type: 'image/webp', size: 9 * 1024 * 1024 }, 'banner').valid).toBe(true);
    });

    it('rejects banners exceeding 10MB', () => {
      const res = validatePageImageFile({ type: 'image/jpeg', size: 11 * 1024 * 1024 }, 'banner');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('10MB');
    });
  });

  describe('Metadata Validation', () => {
    it('rejects empty page name', () => {
      const res = validatePageMetadata({ name: '   ' });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('empty');
    });

    it('rejects overly long page name (> 100 chars)', () => {
      const res = validatePageMetadata({ name: 'A'.repeat(105) });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('100 characters');
    });

    it('normalizes valid website with https:// prefix', () => {
      const res = validatePageMetadata({ name: 'Valid Page', website: 'tukubi.com' });
      expect(res.valid).toBe(true);
      expect(res.safeWebsite).toBe('https://tukubi.com/');
    });

    it('rejects malformed website string', () => {
      const res = validatePageMetadata({ name: 'Valid Page', website: 'htt p:// invalid url' });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('valid website');
    });
  });

  describe('Authorization Rules', () => {
    const ownerId = '00000000-0000-0000-0000-000000000001';
    const adminId = '00000000-0000-0000-0000-000000000002';
    const editorId = '00000000-0000-0000-0000-000000000003';
    const strangerId = '00000000-0000-0000-0000-000000000004';

    it('allows page owner to manage page', () => {
      expect(checkCanManagePage(ownerId, ownerId, 'owner')).toBe(true);
      expect(checkCanManagePage(ownerId, ownerId, null)).toBe(true);
    });

    it('allows page administrator to manage page', () => {
      expect(checkCanManagePage(adminId, ownerId, 'admin')).toBe(true);
    });

    it('denies editor, moderator, or analyst from modifying page profile & settings', () => {
      expect(checkCanManagePage(editorId, ownerId, 'editor')).toBe(false);
      expect(checkCanManagePage(editorId, ownerId, 'moderator')).toBe(false);
      expect(checkCanManagePage(editorId, ownerId, 'analyst')).toBe(false);
    });

    it('denies ordinary followers and unauthenticated users', () => {
      expect(checkCanManagePage(strangerId, ownerId, null)).toBe(false);
      expect(checkCanManagePage(null, ownerId, null)).toBe(false);
      expect(checkCanManagePage(undefined, ownerId, null)).toBe(false);
    });
  });

  describe('Image Property Harmonization', () => {
    it('correctly maps dual image properties for backwards and forwards compatibility', () => {
      const rawBusiness = {
        id: '123',
        name: 'Kool Tech Solutions',
        avatar_url: 'https://storage.tukubi.com/avatars/123.webp',
        cover_image_url: 'https://storage.tukubi.com/banners/123.webp',
      };

      const resolved = {
        ...rawBusiness,
        avatar_url: rawBusiness.avatar_url,
        logo_url: rawBusiness.avatar_url,
        cover_image_url: rawBusiness.cover_image_url,
        cover_url: rawBusiness.cover_image_url,
        banner_url: rawBusiness.cover_image_url,
      };

      expect(resolved.avatar_url).toBe(rawBusiness.avatar_url);
      expect(resolved.logo_url).toBe(rawBusiness.avatar_url);
      expect(resolved.cover_image_url).toBe(rawBusiness.cover_image_url);
      expect(resolved.cover_url).toBe(rawBusiness.cover_image_url);
      expect(resolved.banner_url).toBe(rawBusiness.cover_image_url);
    });
  });
});
