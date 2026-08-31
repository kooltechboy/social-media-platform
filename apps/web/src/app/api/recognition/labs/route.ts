import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getCurrentUser } from '../../../../lib/supabase/server';
import { RecognitionService } from '../../../../lib/recognition/recognition-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const currentUser = await getCurrentUser();
    const recognitionService = new RecognitionService(supabase);
    const programs = await recognitionService.getLabsPrograms(currentUser?.id);

    return NextResponse.json({ programs });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
