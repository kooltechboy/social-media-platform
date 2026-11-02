export interface RawProfileIdentity {
  origin_country_iso?: string | null;
  origin_country_name?: string | null;
  origin_flag?: string | null;
  is_diaspora?: boolean | null;
  diaspora_country_iso?: string | null;
  diaspora_country_name?: string | null;
  diaspora_flag?: string | null;
  visibility?: 'public' | 'private' | 'friends' | string | null;
}

export interface SanitizedProfileIdentity {
  originCountryIso: string | null;
  originCountryName: string | null;
  originFlag: string | null;
  isDiaspora: boolean;
  diasporaCountryIso: string | null;
  diasporaCountryName: string | null;
  diasporaFlag: string | null;
  isOwnerOrPublic: boolean;
}

/**
 * Enforces TUKUBI Rule 8: Privacy of Caribbean Identity.
 * Location/cultural identity is optional and private by default.
 * If visibility is 'private', only the profile owner may view the coordinates/flags.
 */
export function sanitizeProfileIdentity(
  identity: RawProfileIdentity | null | undefined,
  viewerId: string | null | undefined,
  targetProfileId: string
): SanitizedProfileIdentity {
  if (!identity) {
    return {
      originCountryIso: null,
      originCountryName: null,
      originFlag: null,
      isDiaspora: false,
      diasporaCountryIso: null,
      diasporaCountryName: null,
      diasporaFlag: null,
      isOwnerOrPublic: false,
    };
  }

  const isOwner = Boolean(viewerId && viewerId === targetProfileId);
  const isPublic = identity.visibility === 'public';
  const isPermitted = isOwner || isPublic;

  if (!isPermitted) {
    return {
      originCountryIso: null,
      originCountryName: null,
      originFlag: null,
      isDiaspora: false,
      diasporaCountryIso: null,
      diasporaCountryName: null,
      diasporaFlag: null,
      isOwnerOrPublic: false,
    };
  }

  return {
    originCountryIso: identity.origin_country_iso || null,
    originCountryName: identity.origin_country_name || null,
    originFlag: identity.origin_flag || null,
    isDiaspora: Boolean(identity.is_diaspora),
    diasporaCountryIso: identity.diaspora_country_iso || null,
    diasporaCountryName: identity.diaspora_country_name || null,
    diasporaFlag: identity.diaspora_flag || null,
    isOwnerOrPublic: true,
  };
}
