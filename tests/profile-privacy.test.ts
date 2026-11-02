import { describe, it, expect } from 'vitest';
import {
  sanitizeProfileIdentity,
  type RawProfileIdentity,
} from '../apps/web/src/lib/profile/privacy-sanitizer';

describe('Profile Identity Privacy Sanitizer', () => {
  const mockIdentity: RawProfileIdentity = {
    origin_country_iso: 'JM',
    origin_country_name: 'Jamaica',
    origin_flag: '🇯🇲',
    is_diaspora: true,
    diaspora_country_iso: 'US',
    diaspora_country_name: 'United States',
    diaspora_flag: '🇺🇸',
    visibility: 'private',
  };

  it('suppresses origin and diaspora details when visibility is private and viewer is not the profile owner', () => {
    const viewerId = 'viewer-user-123';
    const profileId = 'owner-user-456';

    const result = sanitizeProfileIdentity(mockIdentity, viewerId, profileId);

    expect(result.isOwnerOrPublic).toBe(false);
    expect(result.originCountryIso).toBeNull();
    expect(result.originCountryName).toBeNull();
    expect(result.originFlag).toBeNull();
    expect(result.diasporaCountryIso).toBeNull();
  });

  it('exposes origin and diaspora details when viewer IS the profile owner', () => {
    const ownerId = 'owner-user-456';

    const result = sanitizeProfileIdentity(mockIdentity, ownerId, ownerId);

    expect(result.isOwnerOrPublic).toBe(true);
    expect(result.originCountryIso).toBe('JM');
    expect(result.originCountryName).toBe('Jamaica');
    expect(result.originFlag).toBe('🇯🇲');
    expect(result.diasporaCountryIso).toBe('US');
  });

  it('exposes origin and diaspora details when visibility is public, even for non-owners', () => {
    const publicIdentity: RawProfileIdentity = {
      ...mockIdentity,
      visibility: 'public',
    };
    const viewerId = 'viewer-user-123';
    const profileId = 'owner-user-456';

    const result = sanitizeProfileIdentity(publicIdentity, viewerId, profileId);

    expect(result.isOwnerOrPublic).toBe(true);
    expect(result.originCountryIso).toBe('JM');
    expect(result.originCountryName).toBe('Jamaica');
    expect(result.originFlag).toBe('🇯🇲');
  });

  it('handles null or missing identity records gracefully', () => {
    const result = sanitizeProfileIdentity(null, 'viewer-1', 'owner-2');
    expect(result.isOwnerOrPublic).toBe(false);
    expect(result.originCountryIso).toBeNull();
  });
});
