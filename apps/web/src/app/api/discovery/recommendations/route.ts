import { NextRequest, NextResponse } from 'next/server';
import { fetchPeopleYouMayKnowAction } from '../../../../lib/discovery/actions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || undefined;
    const limit = parseInt(searchParams.get('limit') || '12', 10);

    const recommendations = await fetchPeopleYouMayKnowAction({
      countryIso: country,
      limit,
    });

    return NextResponse.json({ recommendations });
  } catch (err: any) {
    console.error('[API /api/discovery/recommendations] Error:', err);
    return NextResponse.json({ error: 'Recommendation service failure.' }, { status: 500 });
  }
}
