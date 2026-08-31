import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getCurrentUser } from '../../../../lib/supabase/server';
import { RecognitionService } from '../../../../lib/recognition/recognition-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let profileId = searchParams.get('profileId');

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    if (!profileId) {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return NextResponse.json({ error: 'Authentication or profileId required' }, { status: 401 });
      }
      profileId = currentUser.id;
    }

    const recognitionService = new RecognitionService(supabase);
    const summary = await recognitionService.getProfileRecognition(profileId);

    return NextResponse.json(summary);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
