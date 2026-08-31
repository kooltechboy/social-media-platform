import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getCurrentUser } from '../../../../../lib/supabase/server';
import { EligibilityEngine } from '../../../../../lib/recognition/eligibility-engine';
import { RecognitionService } from '../../../../../lib/recognition/recognition-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const programSlug = body.programSlug || 'founding_1000';

    // 1. Evaluate server-side eligibility rules
    const eligibilityEngine = new EligibilityEngine(supabase);
    const eligibility = await eligibilityEngine.evaluateFounderEligibility(currentUser.id, programSlug);

    if (!eligibility.eligible) {
      return NextResponse.json({ error: eligibility.reason }, { status: 400 });
    }

    // 2. Perform atomic assignment through database procedure
    const recognitionService = new RecognitionService(supabase);
    const result = await recognitionService.claimFounderStatus(currentUser.id, programSlug);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Unable to claim founder allocation' }, { status: 400 });
    }

    // Also update user reputation
    await recognitionService.evaluateReputation(currentUser.id);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
