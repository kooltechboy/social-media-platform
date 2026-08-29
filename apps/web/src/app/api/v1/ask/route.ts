import { NextResponse, type NextRequest } from 'next/server';
import { askCaribbean } from '../../../../lib/ai/ask-caribbean';
import { getCurrentUser } from '../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required' },
      { status: 401 }
    );
  }

  const query = request.nextUrl.searchParams.get('q') ?? '';
  if (!query.trim()) {
    return NextResponse.json({ error: 'Query parameter q is required' }, { status: 400 });
  }
  const response = await askCaribbean(query);
  return NextResponse.json(response);
}
