import { sanitizeRedirectUrl } from './redirect-utils';

export { sanitizeRedirectUrl };

export const USERNAME_REGEX = /^[a-z0-9_.]{3,30}$/;

export const RESERVED_USERNAMES = new Set([
  'admin',
  'root',
  'support',
  'tukubi',
  'official',
  'help',
  'api',
  'auth',
  'explore',
  'login',
  'signup',
  'settings',
  'moderation',
  'security',
  'moderator',
  'system',
]);

export interface UsernameValidationResult {
  isValid: boolean;
  error?: string;
  isReserved?: boolean;
}

export function validateUsername(raw: string): UsernameValidationResult {
  const username = (raw || '').trim().toLowerCase();

  if (!username) {
    return { isValid: false, error: 'Username is required.' };
  }

  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long.' };
  }

  if (username.length > 30) {
    return { isValid: false, error: 'Username cannot exceed 30 characters.' };
  }

  if (!USERNAME_REGEX.test(username)) {
    return {
      isValid: false,
      error: 'Username can only contain lowercase letters, numbers, underscores, and dots.',
    };
  }

  if (RESERVED_USERNAMES.has(username)) {
    return {
      isValid: false,
      isReserved: true,
      error: 'This username is reserved by the platform.',
    };
  }

  return { isValid: true };
}

export function generateUsernameSuggestions(base: string): string[] {
  const clean = (base || 'user').toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 20);
  const randomSuffix = Math.floor(10 + Math.random() * 89);
  return [
    `${clean}${randomSuffix}`,
    `${clean}_carib`,
    `the_${clean}`,
    `${clean}_vibes`,
  ];
}

export interface PasswordStrengthResult {
  score: number;
  label: string;
  color: string;
  meetsMinimum: boolean;
}

export function calculatePasswordStrength(pass: string): PasswordStrengthResult {
  if (!pass) {
    return { score: 0, label: '', color: '', meetsMinimum: false };
  }

  let score = 0;
  if (pass.length >= 8) score++;
  if (pass.length >= 12) score++;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
  if (/[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) score++;

  const meetsMinimum = pass.length >= 8 && score >= 2;

  const map: Record<number, { label: string; color: string }> = {
    1: { label: 'Weak', color: 'bg-rose-500' },
    2: { label: 'Fair', color: 'bg-amber-500' },
    3: { label: 'Good', color: 'bg-cyan-400' },
    4: { label: 'Strong (Fortune-100 Grade)', color: 'bg-emerald-400' },
  };

  return {
    score,
    meetsMinimum,
    ...(map[score] || { label: 'Weak', color: 'bg-rose-500' }),
  };
}
