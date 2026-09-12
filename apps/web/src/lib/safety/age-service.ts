/**
 * TUKUBI Child Safety & Regulatory Age Verification Engine
 * Compliance with COPPA, GDPR-K, and global Child Online Safety Standards.
 */

export type AgeTier = 'under_13' | '13_to_17' | '18_plus' | 'unverified';
export type VerificationStatus = 'unverified' | 'pending' | 'verified_self' | 'verified_parent' | 'verified_document';

export interface MinorSafetySettings {
  dmRestrictions: 'followers_only' | 'nobody' | 'everyone';
  safeContentMode: boolean;
  hideOnlineStatus: boolean;
  blockTargetedAds: boolean;
}

export const DEFAULT_MINOR_SETTINGS: MinorSafetySettings = {
  dmRestrictions: 'followers_only',
  safeContentMode: true,
  hideOnlineStatus: true,
  blockTargetedAds: true,
};

export const DEFAULT_ADULT_SETTINGS: MinorSafetySettings = {
  dmRestrictions: 'everyone',
  safeContentMode: false,
  hideOnlineStatus: false,
  blockTargetedAds: false,
};

/**
 * Calculates accurate chronological age from an ISO date string (YYYY-MM-DD).
 */
export function calculateAge(dateOfBirth: string | Date): number {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  if (isNaN(dob.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return Math.max(0, age);
}

/**
 * Resolves regulatory age tier according to international privacy and child protection frameworks.
 */
export function resolveAgeTier(age: number): AgeTier {
  if (age < 13) return 'under_13';
  if (age < 18) return '13_to_17';
  return '18_plus';
}

/**
 * Returns default safety configuration based on age tier.
 */
export function getSafetySettingsForTier(tier: AgeTier): MinorSafetySettings {
  if (tier === 'under_13' || tier === '13_to_17') {
    return DEFAULT_MINOR_SETTINGS;
  }
  return DEFAULT_ADULT_SETTINGS;
}

/**
 * Validates if an account can initiate a direct message to a recipient based on age protection rules.
 */
export function canInitiateDirectMessage(params: {
  senderTier: AgeTier;
  recipientTier: AgeTier;
  isFollowing: boolean;
}): { allowed: boolean; reason?: string } {
  const { senderTier, recipientTier, isFollowing } = params;

  // Minors cannot be contacted by adults unless the minor already follows the adult
  if (recipientTier === '13_to_17' && senderTier === '18_plus' && !isFollowing) {
    return {
      allowed: false,
      reason: 'To protect minors, you can only message this member if they follow you.',
    };
  }

  // Under 13 accounts cannot receive direct messages from non-guardians
  if (recipientTier === 'under_13') {
    return {
      allowed: false,
      reason: 'Direct messaging is restricted for under-13 accounts.',
    };
  }

  return { allowed: true };
}
