import { NextRequest, NextResponse } from 'next/server';
import { dismissRecommendationAction } from '../../../../lib/social/relationship-actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityType, entityId, action, reason } = body;

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entityType and entityId are required.' }, { status: 400 });
    }

    const res = await dismissRecommendationAction(entityType, entityId, action || 'dismiss', reason);
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API /api/discovery/feedback] Error:', err);
    return NextResponse.json({ error: 'Feedback service failure.' }, { status: 500 });
  }
}
