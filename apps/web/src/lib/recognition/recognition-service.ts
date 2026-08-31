import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProfileRecognitionSummary, LabsProgram, SpotlightItem } from './types';

export class RecognitionService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Fetches the complete, consolidated recognition summary for any profile.
   */
  async getProfileRecognition(profileId: string): Promise<ProfileRecognitionSummary> {
    const { data, error } = await this.supabase.rpc('get_profile_recognition', {
      p_profile_id: profileId,
    });

    if (error || !data) {
      // Fallback default snapshot
      return {
        founder: { is_founder: false },
        reputation: {
          score: 10,
          level_tier: 1,
          level_name: 'Newcomer',
          level_title: 'New Member',
          level_emoji: '🌱',
        },
        badges: [],
        achievements: [],
        council: { is_member: false },
        ambassador: { is_ambassador: false },
      };
    }

    return data as ProfileRecognitionSummary;
  }

  /**
   * Evaluates user's eligibility and atomically claims chronological Founder status if eligible.
   */
  async claimFounderStatus(profileId: string, programSlug = 'founding_1000') {
    const { data, error } = await this.supabase.rpc('allocate_founder_number', {
      p_profile_id: profileId,
      p_program_slug: programSlug,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data as {
      success: boolean;
      already_member?: boolean;
      founder_number?: number;
      formatted_number?: string;
      program_name?: string;
      designation?: string;
      error?: string;
    };
  }

  /**
   * Re-evaluates reputation score based on latest platform activity.
   */
  async evaluateReputation(profileId: string) {
    const { data, error } = await this.supabase.rpc('evaluate_user_reputation', {
      p_profile_id: profileId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data as { success: boolean; score: number; level_tier: number };
  }

  /**
   * Awards a badge to a profile securely.
   */
  async awardBadge(profileId: string, badgeSlug: string, reason = 'Platform Achievement', awardedBy?: string) {
    const { data, error } = await this.supabase.rpc('award_badge', {
      p_profile_id: profileId,
      p_badge_slug: badgeSlug,
      p_reason: reason,
      p_awarded_by: awardedBy || null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data as { success: boolean; badge_id?: string; badge_name?: string; error?: string };
  }

  /**
   * Revokes a badge from a profile.
   */
  async revokeBadge(profileId: string, badgeSlug: string, reason: string, revokedBy: string) {
    const { data, error } = await this.supabase.rpc('revoke_badge', {
      p_profile_id: profileId,
      p_badge_slug: badgeSlug,
      p_reason: reason,
      p_revoked_by: revokedBy,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data as { success: boolean; error?: string };
  }

  /**
   * Lists available TUKUBI Labs experimental beta programs.
   */
  async getLabsPrograms(currentUserId?: string): Promise<LabsProgram[]> {
    const { data: programs, error } = await this.supabase
      .from('labs_programs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !programs) return [];

    let userMemberships = new Set<string>();
    if (currentUserId) {
      const { data: memberships } = await this.supabase
        .from('labs_members')
        .select('program_id')
        .eq('profile_id', currentUserId);

      if (memberships) {
        userMemberships = new Set(memberships.map((m) => m.program_id));
      }
    }

    return programs.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      feature_key: p.feature_key,
      description: p.description,
      status: p.status,
      release_notes: p.release_notes,
      max_participants: p.max_participants,
      current_participants_count: p.current_participants_count,
      is_member: userMemberships.has(p.id),
    }));
  }

  /**
   * Opts in to a TUKUBI Labs program.
   */
  async joinLabsProgram(profileId: string, programId: string) {
    const { error } = await this.supabase.from('labs_members').insert({
      profile_id: profileId,
      program_id: programId,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  /**
   * Opts out of a TUKUBI Labs program.
   */
  async leaveLabsProgram(profileId: string, programId: string) {
    const { error } = await this.supabase
      .from('labs_members')
      .delete()
      .eq('profile_id', profileId)
      .eq('program_id', programId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  /**
   * Fetches published Spotlights.
   */
  async getActiveSpotlights(): Promise<SpotlightItem[]> {
    const now = new Date().toISOString();
    const { data, error } = await this.supabase
      .from('spotlights')
      .select(`
        id, category, headline, story, media_url, featured_from, featured_until,
        profile:profiles(id, username, display_name, avatar_url, is_verified)
      `)
      .eq('is_published', true)
      .lte('featured_from', now)
      .gte('featured_until', now)
      .order('featured_from', { ascending: false });

    if (error || !data) return [];
    return data as unknown as SpotlightItem[];
  }
}
