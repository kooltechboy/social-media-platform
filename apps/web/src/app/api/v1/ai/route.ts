import { NextResponse, type NextRequest } from 'next/server';
import { CaribAIEngine } from '@caribbean/ai';
import { getCurrentUser } from '../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

const TASKS = ['translate', 'classify'] as const;
type Task = (typeof TASKS)[number];

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required' },
      { status: 401 }
    );
  }

  let body: { task?: string; text?: string; targetLanguage?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const task = body.task as Task | undefined;
  const text = String(body.text ?? '').trim();
  if (!TASKS.includes(task as Task)) {
    return NextResponse.json({ error: 'task must be one of: translate, classify' }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }
  if (text.length > 5000) {
    return NextResponse.json({ error: 'text exceeds 5000 characters' }, { status: 400 });
  }

  const engine = new CaribAIEngine();

  if (task === 'translate') {
    const targetLanguage = body.targetLanguage ?? 'en';
    const translation = await engine.translateContent(text, targetLanguage);
    return NextResponse.json({ task, targetLanguage, translation });
  }

  const risk = await engine.classifyContentRisk(text);
  return NextResponse.json({ task, risk });
}
