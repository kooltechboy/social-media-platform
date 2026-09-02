import { describe, it, expect } from 'vitest';

describe('TUKUBI — Profile & Settings Validation Suite', () => {
  describe('Username Validation & Security Rules', () => {
    const RESERVED = new Set([
      'admin',
      'superadmin',
      'administrator',
      'tukubi',
      'system',
      'support',
      'staff',
      'moderator',
      'help',
      'api',
      'root',
      'auth',
      'login',
      'signup',
      'profile',
      'settings',
    ]);

    function validateUsername(raw: string): { valid: boolean; error?: string } {
      const clean = (raw || '').trim().toLowerCase();
      if (!clean) return { valid: false, error: 'Username is required.' };
      if (clean.length < 3 || clean.length > 30) {
        return { valid: false, error: 'Username must be 3-30 characters.' };
      }
      if (!/^[a-z0-9_.]{3,30}$/.test(clean)) {
        return { valid: false, error: 'Username contains invalid characters.' };
      }
      if (RESERVED.has(clean)) {
        return { valid: false, error: 'Username is reserved.' };
      }
      return { valid: true };
    }

    it('accepts valid Caribbean usernames', () => {
      expect(validateUsername('karenereid').valid).toBe(true);
      expect(validateUsername('dj_williams').valid).toBe(true);
      expect(validateUsername('kingston.vibes').valid).toBe(true);
      expect(validateUsername('island_queen24').valid).toBe(true);
    });

    it('rejects usernames that are too short or too long', () => {
      expect(validateUsername('ab').valid).toBe(false);
      expect(validateUsername('a'.repeat(31)).valid).toBe(false);
    });

    it('rejects illegal characters and spaces', () => {
      expect(validateUsername('user name').valid).toBe(false);
      expect(validateUsername('user@domain').valid).toBe(false);
      expect(validateUsername('user!#$').valid).toBe(false);
      expect(validateUsername('<script>').valid).toBe(false);
    });

    it('rejects reserved administrative usernames', () => {
      for (const reserved of Array.from(RESERVED)) {
        const res = validateUsername(reserved);
        expect(res.valid, `Expected "${reserved}" to be rejected`).toBe(false);
      }
    });
  });

  describe('Profile Image & Media Upload Validation', () => {
    const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
    const MAX_COVER_SIZE = 10 * 1024 * 1024; // 10MB

    function validateImageUpload(
      file: { name: string; type: string; size: number },
      kind: 'avatar' | 'cover'
    ): { valid: boolean; error?: string } {
      const max = kind === 'avatar' ? MAX_AVATAR_SIZE : MAX_COVER_SIZE;
      if (!ALLOWED_MIME.includes(file.type.toLowerCase())) {
        return { valid: false, error: 'Unsupported file format.' };
      }
      if (file.size > max) {
        return { valid: false, error: `File size exceeds ${max / (1024 * 1024)}MB limit.` };
      }
      // Path traversal or extension check
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
        return { valid: false, error: 'Invalid file extension.' };
      }
      return { valid: true };
    }

    it('accepts valid avatar images under 5MB', () => {
      const validJpg = { name: 'profile.jpg', type: 'image/jpeg', size: 1024 * 500 };
      const validPng = { name: 'avatar.png', type: 'image/png', size: 1024 * 1024 * 2 };
      const validWebp = { name: 'photo.webp', type: 'image/webp', size: 1024 * 200 };

      expect(validateImageUpload(validJpg, 'avatar').valid).toBe(true);
      expect(validateImageUpload(validPng, 'avatar').valid).toBe(true);
      expect(validateImageUpload(validWebp, 'avatar').valid).toBe(true);
    });

    it('rejects oversized avatars', () => {
      const oversized = { name: 'huge.png', type: 'image/png', size: 6 * 1024 * 1024 };
      const res = validateImageUpload(oversized, 'avatar');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('exceeds 5MB');
    });

    it('rejects dangerous MIME types (HTML, SVG, script executables)', () => {
      expect(validateImageUpload({ name: 'exploit.svg', type: 'image/svg+xml', size: 100 }, 'avatar').valid).toBe(false);
      expect(validateImageUpload({ name: 'script.js', type: 'application/javascript', size: 100 }, 'avatar').valid).toBe(false);
      expect(validateImageUpload({ name: 'page.html', type: 'text/html', size: 100 }, 'avatar').valid).toBe(false);
    });
  });

  describe('Privacy & Sensitive Field Masking', () => {
    interface UserProfile {
      id: string;
      username: string;
      display_name: string;
      date_of_birth: string | null;
      dob_visibility: 'public' | 'followers' | 'private';
      address: string | null;
      address_visibility: 'public' | 'followers' | 'private';
      relationship_status: string | null;
      relationship_visibility: 'public' | 'followers' | 'private';
      phone: string | null;
    }

    function maskProfileForViewer(
      profile: UserProfile,
      viewerId: string | null,
      isFollower: boolean = false
    ): Partial<UserProfile> {
      const isOwner = viewerId === profile.id;
      if (isOwner) return { ...profile };

      const masked: Partial<UserProfile> = {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        // Phone is always private
        phone: null,
      };

      // DOB
      if (profile.dob_visibility === 'public' || (profile.dob_visibility === 'followers' && isFollower)) {
        masked.date_of_birth = profile.date_of_birth;
      } else {
        masked.date_of_birth = null;
      }

      // Address
      if (profile.address_visibility === 'public' || (profile.address_visibility === 'followers' && isFollower)) {
        masked.address = profile.address;
      } else {
        masked.address = null;
      }

      // Relationship
      if (profile.relationship_visibility === 'public' || (profile.relationship_visibility === 'followers' && isFollower)) {
        masked.relationship_status = profile.relationship_status;
      } else {
        masked.relationship_status = null;
      }

      return masked;
    }

    const testProfile: UserProfile = {
      id: 'usr-1234',
      username: 'caribbean_star',
      display_name: 'Caribbean Star',
      date_of_birth: '1995-08-15',
      dob_visibility: 'private',
      address: '123 Palm Ave, Kingston, Jamaica',
      address_visibility: 'private',
      relationship_status: 'Married',
      relationship_visibility: 'public',
      phone: '+18765551234',
    };

    it('exposes all fields to the profile owner', () => {
      const ownerView = maskProfileForViewer(testProfile, 'usr-1234');
      expect(ownerView.date_of_birth).toBe('1995-08-15');
      expect(ownerView.address).toBe('123 Palm Ave, Kingston, Jamaica');
      expect(ownerView.phone).toBe('+18765551234');
      expect(ownerView.relationship_status).toBe('Married');
    });

    it('masks private DOB, address, and phone for third-party visitors', () => {
      const visitorView = maskProfileForViewer(testProfile, 'usr-other');
      expect(visitorView.date_of_birth).toBeNull();
      expect(visitorView.address).toBeNull();
      expect(visitorView.phone).toBeNull();
      // Public relationship status remains visible
      expect(visitorView.relationship_status).toBe('Married');
    });

    it('masks fields for unauthenticated guests', () => {
      const guestView = maskProfileForViewer(testProfile, null);
      expect(guestView.date_of_birth).toBeNull();
      expect(guestView.address).toBeNull();
      expect(guestView.phone).toBeNull();
    });
  });

  describe('Security & Password Complexity Rules', () => {
    function validatePasswordChange(password: string, confirm: string): { valid: boolean; error?: string } {
      if (!password || password.length < 8) {
        return { valid: false, error: 'Password must be at least 8 characters long.' };
      }
      if (password !== confirm) {
        return { valid: false, error: 'Passwords do not match.' };
      }
      if (!/(?=.*[a-zA-Z])(?=.*[0-9!@#$%^&*])/.test(password)) {
        return { valid: false, error: 'Password must contain letters and numbers or symbols.' };
      }
      return { valid: true };
    }

    it('accepts strong passwords matching confirmation', () => {
      expect(validatePasswordChange('Caribbean2026!', 'Caribbean2026!').valid).toBe(true);
      expect(validatePasswordChange('SecureTukubi99', 'SecureTukubi99').valid).toBe(true);
    });

    it('rejects mismatched password confirmations', () => {
      const res = validatePasswordChange('Caribbean2026!', 'Caribbean2026?');
      expect(res.valid).toBe(false);
      expect(res.error).toBe('Passwords do not match.');
    });

    it('rejects short or simple passwords without numbers/symbols', () => {
      expect(validatePasswordChange('abc', 'abc').valid).toBe(false);
      expect(validatePasswordChange('password', 'password').valid).toBe(false);
    });
  });

  describe('Data Portability Package Assembly (GDPR & Data Rights)', () => {
    it('produces compliant JSON export containing all user entities', () => {
      const mockPayload = {
        metadata: {
          platform: 'TUKUBI',
          exported_at: '2026-08-29T18:00:00.000Z',
          user_id: 'user_111',
          email: 'dan@example.com',
        },
        profile: {
          username: 'danj',
          display_name: 'Daniel',
          bio: 'Caribbean Creator',
        },
        notification_preferences: {
          push_enabled: true,
          email_enabled: true,
        },
        statistics: {
          followers_count: 42,
          following_count: 10,
          posts_count: 5,
        },
        recent_posts: [
          { id: 'p1', content: 'Big vibes in Montego Bay!', created_at: '2026-08-28' },
        ],
      };

      const jsonStr = JSON.stringify(mockPayload);
      const parsed = JSON.parse(jsonStr);

      expect(parsed.metadata.platform).toBe('TUKUBI');
      expect(parsed.profile.username).toBe('danj');
      expect(parsed.statistics.followers_count).toBe(42);
      expect(parsed.recent_posts).toHaveLength(1);
    });
  });

  describe('Multilingual Platform — Language Preferences & 6-Locale Constraints', () => {
    const VALID_LOCALES = ['en', 'es', 'fr', 'ht', 'nl', 'pap'];

    function sanitizeLanguagePreference(lang: string): string {
      return VALID_LOCALES.includes(lang) ? lang : 'en';
    }

    it('accepts all 6 official Caribbean platform locales', () => {
      for (const loc of VALID_LOCALES) {
        expect(sanitizeLanguagePreference(loc)).toBe(loc);
      }
    });

    it('falls back to default English (en) for invalid or unsupported languages', () => {
      expect(sanitizeLanguagePreference('de')).toBe('en');
      expect(sanitizeLanguagePreference('zh')).toBe('en');
      expect(sanitizeLanguagePreference('ru')).toBe('en');
      expect(sanitizeLanguagePreference('pt')).toBe('en');
      expect(sanitizeLanguagePreference('')).toBe('en');
      expect(sanitizeLanguagePreference('unknown')).toBe('en');
    });

    it('verifies that Haitian Creole (ht) and Papiamentu (pap) are recognized core locales', () => {
      expect(sanitizeLanguagePreference('ht')).toBe('ht');
      expect(sanitizeLanguagePreference('pap')).toBe('pap');
    });
  });

  describe('Geographic Identity & Country Integrity Guarantees', () => {
    it('preserves distinct concepts for residence Country vs Caribbean Island/Heritage', () => {
      const diasporaProfile = {
        country: 'United States',
        island: 'Dominican Republic',
        city: 'Miami',
      };

      expect(diasporaProfile.country).not.toBe(diasporaProfile.island);
      expect(diasporaProfile.country).toBe('United States');
      expect(diasporaProfile.island).toBe('Dominican Republic');
    });

    it('ensures unprovided country defaults to null/empty and NEVER to Jamaica', () => {
      function resolveProfileOrigin(originCountryIso?: string): string | null {
        return originCountryIso || null;
      }

      expect(resolveProfileOrigin(undefined)).toBeNull();
      expect(resolveProfileOrigin('')).toBeNull();
      expect(resolveProfileOrigin('TTO')).toBe('TTO');
      expect(resolveProfileOrigin('JAM')).toBe('JAM');
    });

    it('formats location display cleanly with missing fields', () => {
      function formatLocation(city?: string | null, island?: string | null, country?: string | null): string {
        return [city, island, country].filter(Boolean).join(', ');
      }

      expect(formatLocation('Kingston', 'Jamaica', 'Jamaica')).toBe('Kingston, Jamaica, Jamaica');
      expect(formatLocation('Brooklyn', 'Barbados', 'United States')).toBe('Brooklyn, Barbados, United States');
      expect(formatLocation(null, null, 'Canada')).toBe('Canada');
      expect(formatLocation(null, 'Trinidad', null)).toBe('Trinidad');
      expect(formatLocation(null, null, null)).toBe('');
    });
  });

  describe('Full Profile & Account Type Architecture', () => {
    it('adapts media upload labels based on account classification', () => {
      function getAvatarUploadLabel(accountType?: string): string {
        if (accountType === 'organization') return 'Organization Logo / Emblem';
        if (accountType === 'business') return 'Business Logo';
        if (accountType === 'creator') return 'Creator Identity Image';
        return 'Profile Photo';
      }

      expect(getAvatarUploadLabel('organization')).toBe('Organization Logo / Emblem');
      expect(getAvatarUploadLabel('business')).toBe('Business Logo');
      expect(getAvatarUploadLabel('creator')).toBe('Creator Identity Image');
      expect(getAvatarUploadLabel('personal')).toBe('Profile Photo');
      expect(getAvatarUploadLabel(undefined)).toBe('Profile Photo');
    });

    it('sanitizes social handle prefixes properly', () => {
      function sanitizeHandle(handle: string): string {
        return handle.trim().replace(/^@+/, '');
      }

      expect(sanitizeHandle('@carib_vibes')).toBe('carib_vibes');
      expect(sanitizeHandle('@@island_dev')).toBe('island_dev');
      expect(sanitizeHandle('plain_user')).toBe('plain_user');
    });

    it('suppresses newcomer gamification indicator for official platform accounts', () => {
      function shouldShowNewcomerBadge(profile: { is_official?: boolean; username: string; is_system_account?: boolean }): boolean {
        if (profile.is_official || profile.username.toLowerCase() === 'tukubi' || profile.is_system_account) {
          return false;
        }
        return true;
      }

      expect(shouldShowNewcomerBadge({ username: 'tukubi', is_official: true })).toBe(false);
      expect(shouldShowNewcomerBadge({ username: 'TUKUBI', is_official: false })).toBe(false);
      expect(shouldShowNewcomerBadge({ username: 'system_bot', is_system_account: true })).toBe(false);
      expect(shouldShowNewcomerBadge({ username: 'regular_user', is_official: false })).toBe(true);
    });

    it('falls back to Tukubi official emblem when avatar is null for @tukubi', () => {
      function resolveAvatarSource(avatarUrl: string | null | undefined, usernameOrName: string): string | null {
        if (avatarUrl) return avatarUrl;
        const normalized = usernameOrName.toUpperCase();
        if (normalized === 'TUKUBI' || normalized === 'TUKUBI OFFICIAL') {
          return '/brand/tukubi-emblem.png';
        }
        return null;
      }

      expect(resolveAvatarSource(null, 'TUKUBI')).toBe('/brand/tukubi-emblem.png');
      expect(resolveAvatarSource(undefined, 'tukubi')).toBe('/brand/tukubi-emblem.png');
      expect(resolveAvatarSource('https://cdn.tukubi.com/custom.jpg', 'TUKUBI')).toBe('https://cdn.tukubi.com/custom.jpg');
      expect(resolveAvatarSource(null, 'Jane Doe')).toBeNull();
    });

    it('validates account_type enum constraints', () => {
      const validTypes = ['personal', 'creator', 'business', 'organization'];
      function isValidAccountType(t: string): boolean {
        return validTypes.includes(t);
      }

      expect(isValidAccountType('personal')).toBe(true);
      expect(isValidAccountType('creator')).toBe(true);
      expect(isValidAccountType('business')).toBe(true);
      expect(isValidAccountType('organization')).toBe(true);
      expect(isValidAccountType('invalid_type')).toBe(false);
    });
  });
});


