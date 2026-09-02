import { NextRequest, NextResponse } from 'next/server';
import { universalSearchAction } from '../../../../lib/discovery/actions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || undefined;
    const country = searchParams.get('country') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);

    const results = await universalSearchAction({
      term: q,
      category,
      countryIso: country,
      limit,
      page,
    });

    return NextResponse.json(results);
  } catch (err: any) {
    console.error('[API /api/discovery/search] Error:', err);
    return NextResponse.json({ error: 'Search service failure.' }, { status: 500 });
  }
}
