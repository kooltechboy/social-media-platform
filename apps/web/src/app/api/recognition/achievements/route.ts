import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getCurrentUser } from '../../../../lib/supabase/server';
import { EligibilityEngine } from '../../../../lib/recognition/eligibility-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const currentUser = await getCurrentUser();

    // If authenticated, trigger real-time achievement progress evaluation
    if (currentUser) {
      const engine = new EligibilityEngine(supabase);
      await engine.evaluateAchievements(currentUser.id);
    }

    const { data: achievements, error } = await supabase
      .from('recognition_achievements')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let userProgressMap = new Map<string, { is_unlocked: boolean; progress_percentage: number; unlocked_at?: string }>();
    if (currentUser) {
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id, is_unlocked, progress_percentage, unlocked_at')
        .eq('profile_id', currentUser.id);

      if (userAchievements) {
        userProgressMap = new Map(
          userAchievements.map((ua) => [
            ua.achievement_id,
            {
              is_unlocked: ua.is_unlocked,
              progress_percentage: ua.progress_percentage,
              unlocked_at: ua.unlocked_at,
            },
          ])
        );
      }
    }

    const formatted = (achievements ?? []).map((a) => {
      const userState = userProgressMap.get(a.id);
      return {
        id: a.id,
        slug: a.slug,
        name: a.name,
        description: a.description,
        category: a.category,
        icon: a.icon,
        points: a.points,
        rarity: a.rarity,
        is_unlocked: userState?.is_unlocked ?? false,
        progress_percentage: userState?.progress_percentage ?? 0,
        unlocked_at: userState?.unlocked_at,
      };
    });

    return NextResponse.json({ achievements: formatted });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
