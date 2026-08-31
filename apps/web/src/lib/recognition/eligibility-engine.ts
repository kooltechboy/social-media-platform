import type { SupabaseClient } from '@supabase/supabase-js';

export interface EligibilityEvaluationResult {
  eligible: boolean;
  reason?: string;
  missingCriteria?: string[];
}

export class EligibilityEngine {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Evaluates if a user is eligible for Founder status.
   * Criteria: Account verified or completed profile setup + Program slots remaining.
   */
  async evaluateFounderEligibility(profileId: string, programSlug = 'founding_1000'): Promise<EligibilityEvaluationResult> {
    // 1. Check profile existence and minimal quality bar
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('id, username, display_name, created_at, is_verified')
      .eq('id', profileId)
      .maybeSingle();

    if (!profile) {
      return { eligible: false, reason: 'Profile record not found.' };
    }

    if (!profile.username || !profile.display_name) {
      return { eligible: false, reason: 'Profile must have username and display name completed.' };
    }

    // 2. Check program state and capacity
    const { data: program } = await this.supabase
      .from('founder_programs')
      .select('max_members, current_count, is_closed')
      .eq('slug', programSlug)
      .maybeSingle();

    if (!program) {
      return { eligible: false, reason: 'Program not found.' };
    }

    if (program.is_closed || program.current_count >= program.max_members) {
      return { eligible: false, reason: 'Founder program enrollment has reached its maximum allocation limit.' };
    }

    return { eligible: true, reason: 'Qualified for Founder Program allocation.' };
  }

  /**
   * Evaluates user milestone achievements (e.g. verified referrals, creator/merchant activity).
   */
  async evaluateAchievements(profileId: string): Promise<string[]> {
    const unlockedSlugs: string[] = [];

    // Check referrals count
    const { count: referralCount } = await this.supabase
      .from('recognition_referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', profileId)
      .eq('status', 'verified');

    const totalReferrals = referralCount || 0;
    if (totalReferrals >= 5) unlockedSlugs.push('connector_5');
    if (totalReferrals >= 25) unlockedSlugs.push('community_builder_25');
    if (totalReferrals >= 100) unlockedSlugs.push('ambassador_100');

    // Check marketplace / store participation
    const { count: productCount } = await this.supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', profileId);

    if ((productCount || 0) > 0) {
      unlockedSlugs.push('marketplace_pioneer');
    }

    // Award all newly unlocked achievements
    for (const slug of unlockedSlugs) {
      const { data: achievement } = await this.supabase
        .from('recognition_achievements')
        .select('id, unlock_badge_id, slug')
        .eq('slug', slug)
        .maybeSingle();

      if (achievement) {
        await this.supabase.from('user_achievements').upsert({
          profile_id: profileId,
          achievement_id: achievement.id,
          progress_percentage: 100,
          is_unlocked: true,
          unlocked_at: new Date().toISOString(),
        }, { onConflict: 'profile_id, achievement_id' });

        if (achievement.unlock_badge_id) {
          await this.supabase.from('user_badges').upsert({
            profile_id: profileId,
            badge_id: achievement.unlock_badge_id,
            award_reason: `Completed achievement: ${achievement.slug}`,
            is_visible: true,
          }, { onConflict: 'profile_id, badge_id' });
        }
      }
    }

    return unlockedSlugs;
  }
}
