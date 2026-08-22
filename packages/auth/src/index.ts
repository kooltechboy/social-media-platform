// Identity & Authentication Abstraction for CARIBBEAN ONE

// ---------------------------------------------------------------------------
// The caller passes in a Supabase client; we avoid a direct dependency on
// @supabase/supabase-js by declaring a structural type contract.
// ---------------------------------------------------------------------------

type SupabaseClientLike = {
  auth: {
    getUser(): Promise<{
      data: { user: { id: string; email?: string } | null };
      error: unknown;
    }>;
  };
  from(table: string): {
    select(columns: string): {
      eq(col: string, val: string): {
        maybeSingle(): Promise<{
          data: Record<string, unknown> | null;
          error: unknown;
        }>;
      };
    };
  };
};

// ---------------------------------------------------------------------------

export interface AuthSession {
  userId: string;
  email: string;
  username: string;
  displayName: string;
  /** Optional — only populated when the profile includes a country code. */
  originCountryIso?: string;
  accountType: 'personal' | 'creator' | 'business' | 'organization';
  mfaEnabled: boolean;
}

export class AuthManager {
  /**
   * @deprecated Use `createSessionFromSupabase()` instead.
   * Legacy mock validator — returns hardcoded data and does NOT verify tokens.
   */
  public static validateSession(token: string): AuthSession | null {
    if (!token) return null;
    return {
      userId: 'usr_89324',
      email: 'user@caribbeanone.app',
      username: 'caribbean_pioneer',
      displayName: 'Caribbean Pioneer',
      originCountryIso: 'JAM',
      accountType: 'creator',
      mfaEnabled: true,
    };
  }

  /**
   * Creates an AuthSession from a live Supabase client instance.
   *
   * 1. Calls `supabase.auth.getUser()` to retrieve the authenticated user.
   * 2. Queries the `profiles` table for username, display_name, and account_type.
   * 3. Returns a fully-populated `AuthSession`, or `null` when no valid session
   *    exists (e.g. expired JWT, missing profile row).
   */
  public static async createSessionFromSupabase(
    supabaseClient: SupabaseClientLike,
  ): Promise<AuthSession | null> {
    // Step 1 — Resolve the authenticated user from Supabase Auth
    const { data: authData, error: authError } =
      await supabaseClient.auth.getUser();

    if (authError || !authData.user) {
      return null;
    }

    const user = authData.user;

    // Step 2 — Fetch the profile row
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('username, display_name, account_type, origin_country_iso')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return null;
    }

    // Step 3 — Build the session
    const session: AuthSession = {
      userId: user.id,
      email: user.email ?? '',
      username: (profile.username as string) ?? '',
      displayName: (profile.display_name as string) ?? '',
      accountType:
        (profile.account_type as AuthSession['accountType']) ?? 'personal',
      mfaEnabled: false, // determined by Supabase MFA factor list; default safe
    };

    if (profile.origin_country_iso) {
      session.originCountryIso = profile.origin_country_iso as string;
    }

    return session;
  }

  /**
   * Formats Passkey WebAuthn challenge payload
   */
  public static createPasskeyChallenge(userId: string) {
    return {
      challenge: `chk_${Date.now()}_${userId}`,
      rp: { name: 'CARIBBEAN ONE', id: 'caribbeanone.app' },
      user: { id: userId, name: userId, displayName: 'Caribbean User' },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
      timeout: 60000,
    };
  }
}
