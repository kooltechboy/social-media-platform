import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getCurrentUser } from '../../../../../../lib/supabase/server';
import { RecognitionService } from '../../../../../../lib/recognition/recognition-service';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const recognitionService = new RecognitionService(supabase);
    const result = await recognitionService.joinLabsProgram(currentUser.id, id);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to join Labs program' }, { status: 400 });
    }

    // Award TUKUBI Labs Member badge automatically if not already held
    await recognitionService.awardBadge(currentUser.id, 'tukubi_labs_member', 'Enrolled in experimental TUKUBI Labs beta');

    return NextResponse.json({ success: true, message: 'Successfully joined TUKUBI Labs feature cohort.' });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const recognitionService = new RecognitionService(supabase);
    const result = await recognitionService.leaveLabsProgram(currentUser.id, id);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to opt out of Labs program' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
