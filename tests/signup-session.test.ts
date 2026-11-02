import { describe, it, expect, beforeEach } from 'vitest';

class MockStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] || null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

// Set up mock window and storage globals
const mockLocal = new MockStorage();
const mockSession = new MockStorage();

(globalThis as any).window = globalThis;
(globalThis as any).localStorage = mockLocal;
(globalThis as any).sessionStorage = mockSession;

import {
  getSignupSession,
  saveSignupSession,
  clearSignupSession,
} from '../apps/web/src/lib/auth/signup-session';

describe('Signup Session Draft Engine', () => {
  beforeEach(() => {
    mockLocal.clear();
    mockSession.clear();
    clearSignupSession();
  });

  it('persists non-sensitive profile state to localStorage', () => {
    saveSignupSession({
      intent: 'creator',
      originCountryIso: 'JM',
      originCountryName: 'Jamaica',
      username: 'carib_artist',
      email: 'artist@tukubi.carib',
    });

    const retrieved = getSignupSession();
    expect(retrieved.intent).toBe('creator');
    expect(retrieved.originCountryIso).toBe('JM');
    expect(retrieved.username).toBe('carib_artist');
    expect(retrieved.email).toBe('artist@tukubi.carib');

    const rawLocal = mockLocal.getItem('tukubi_signup_state_v1');
    expect(rawLocal).toBeTruthy();
    const parsed = JSON.parse(rawLocal!);
    expect(parsed.username).toBe('carib_artist');
  });

  it('never stores raw password in localStorage, but retains in sessionStorage during active tab', () => {
    saveSignupSession({
      username: 'safe_user',
      password: 'SuperSecretPassword#2026',
    });

    const rawLocal = mockLocal.getItem('tukubi_signup_state_v1');
    expect(rawLocal).toBeTruthy();
    expect(rawLocal).not.toContain('SuperSecretPassword#2026');
    const parsed = JSON.parse(rawLocal!);
    expect(parsed.password).toBeUndefined();

    // Password must be available in active session for final submission
    const session = getSignupSession();
    expect(session.password).toBe('SuperSecretPassword#2026');
  });

  it('clears all session and local state upon clearSignupSession()', () => {
    saveSignupSession({
      username: 'temp_user',
      password: 'TemporaryPass123!',
    });

    clearSignupSession();

    const retrieved = getSignupSession();
    expect(retrieved.username).toBeUndefined();
    expect(retrieved.password).toBeUndefined();
    expect(mockLocal.getItem('tukubi_signup_state_v1')).toBeNull();
  });
});
