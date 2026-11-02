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
  dateOfBirth?: string;
  marketingConsent?: boolean;
  termsVersion?: string;
  privacyVersion?: string;
  avatarUrl?: string;
  interests?: string[];
}

const STORAGE_KEY = 'tukubi_signup_state_v1';
const SESSION_CRED_KEY = 'tukubi_signup_cred_v1';

let inMemoryPassword: string | undefined;

export function getSignupSession(): SignupState {
  if (typeof window === 'undefined') return {};
  try {
    let result: SignupState = {};
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      result = JSON.parse(raw) as SignupState;
      // Guarantee password is never read from or kept in localStorage
      if (Object.prototype.hasOwnProperty.call(result, 'password')) {
        delete result.password;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      }
    }

    // Retrieve active tab transient password from sessionStorage or memory
    let tabPassword = inMemoryPassword;
    if (!tabPassword && typeof sessionStorage !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(SESSION_CRED_KEY);
        if (stored) {
          tabPassword = stored;
          inMemoryPassword = stored;
        }
      } catch {
        // Restricted storage fallback
      }
    }

    if (tabPassword) {
      result.password = tabPassword;
    }

    return result;
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

    if (patch.password !== undefined) {
      inMemoryPassword = patch.password;
      if (typeof sessionStorage !== 'undefined') {
        try {
          if (patch.password) {
            sessionStorage.setItem(SESSION_CRED_KEY, patch.password);
          } else {
            sessionStorage.removeItem(SESSION_CRED_KEY);
          }
        } catch {
          // Fallback if sessionStorage is disabled
        }
      }
    }

    // Never serialize password to localStorage
    const { password: _pw, ...persisted } = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    return updated;
  } catch (err) {
    console.error('Failed to save signup state:', err);
    return patch;
  }
}

export function clearSignupSession(): void {
  if (typeof window === 'undefined') return;
  try {
    inMemoryPassword = undefined;
    localStorage.removeItem(STORAGE_KEY);
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem(SESSION_CRED_KEY);
      } catch {
        // Fallback
      }
    }
  } catch (err) {
    console.error('Failed to clear signup state:', err);
  }
}
