import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSignupSession, getSignupSession, saveSignupSession } from '../../apps/web/src/lib/auth/signup-session';

describe('signup session security', () => {
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
});
