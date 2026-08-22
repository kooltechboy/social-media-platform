import { NextResponse, type NextRequest } from 'next/server';
import { askCaribbean } from '../../../../lib/ai/ask-caribbean';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') ?? '';
  if (!query.trim()) {
    return NextResponse.json({ error: 'Query parameter q is required' }, { status: 400 });
  }
  const response = await askCaribbean(query);
  return NextResponse.json(response);
}
