'use client';

export type AccountIntent =
  | 'personal'
  | 'creator'
  | 'business'
  | 'organization'
  | 'media'
  | 'community'
  | 'seller';

export interface SignupState {
  intent?: AccountIntent;
  originCountryIso?: string;
  originCountryName?: string;
  originFlag?: string;
  isDiaspora?: boolean;
  diasporaCountryIso?: string;
  diasporaCountryName?: string;
  diasporaFlag?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  avatarUrl?: string;
  interests?: string[];
}

const STORAGE_KEY = 'tukubi_signup_state_v1';

export function getSignupSession(): SignupState {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Failed to read signup state:', err);
    return {};
  }
}

export function saveSignupSession(patch: Partial<SignupState>): SignupState {
  if (typeof window === 'undefined') return patch;
  try {
    const current = getSignupSession();
    const updated = { ...current, ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save signup state:', err);
    return patch;
  }
}

export function clearSignupSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear signup state:', err);
  }
}
