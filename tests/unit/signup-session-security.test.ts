import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSignupSession, getSignupSession, saveSignupSession } from '../../apps/web/src/lib/auth/signup-session';

describe('signup session security & statutory fields', () => {
  let stored: string | null;

  beforeEach(() => {
    vi.stubGlobal('window', {});
    stored = null;
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => stored),
      setItem: vi.fn((_key: string, value: string) => { stored = value; }),
      removeItem: vi.fn(),
    });
    clearSignupSession();
  });

  it('does not persist passwords in browser storage', () => {
    saveSignupSession({ email: 'member@example.com', password: 'correct horse battery staple' });

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'tukubi_signup_state_v1',
      JSON.stringify({ email: 'member@example.com' }),
    );
  });

  it('keeps the password available only for the current in-memory signup flow', () => {
    saveSignupSession({ email: 'member@example.com', password: 'correct horse battery staple' });

    expect(getSignupSession()).toMatchObject({
      email: 'member@example.com',
      password: 'correct horse battery staple',
    });
  });

  it('persists dateOfBirth and legal consent metadata across steps while isolating credentials', () => {
    saveSignupSession({
      email: 'caribbean.innovator@tukubi.com',
      password: 'securePassword123!',
      dateOfBirth: '1998-05-14',
      marketingConsent: true,
      termsVersion: '2026.1',
      privacyVersion: '2026.1',
    });

    const parsedStorage = JSON.parse(stored!);
    expect(parsedStorage).toEqual({
      email: 'caribbean.innovator@tukubi.com',
      dateOfBirth: '1998-05-14',
      marketingConsent: true,
      termsVersion: '2026.1',
      privacyVersion: '2026.1',
    });
    expect(parsedStorage.password).toBeUndefined();

    const inMemorySession = getSignupSession();
    expect(inMemorySession.dateOfBirth).toBe('1998-05-14');
    expect(inMemorySession.marketingConsent).toBe(true);
    expect(inMemorySession.termsVersion).toBe('2026.1');
    expect(inMemorySession.password).toBe('securePassword123!');
  });
});
