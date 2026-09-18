import { NextResponse } from 'next/server';
import { AskCaribbeanPlanner, CaribAIEngine } from '@caribbean/ai';
import { cookies } from 'next/headers';
import { askCaribbean } from '../../../../lib/ai/ask-caribbean';

const rateLimits = new Map<string, number>();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    
    if (!q) {
      return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
    }

    // Per-client rate limiting (IP-aware for unauthenticated callers)
    const ip = request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown-ip';
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-tukubi-auth-token')?.value;
    const clientKey = token ? `user-${token.slice(-16)}` : `ip-${ip}`;
    const now = Date.now();
    const lastCall = rateLimits.get(`${clientKey}-search`) || 0;
    
    if (now - lastCall < 6000) { // 10 searches per minute -> ~6 seconds between searches
      return NextResponse.json({ error: 'Rate limit exceeded. Please wait a moment.' }, { status: 429 });
    }
    rateLimits.set(`${clientKey}-search`, now);

    const searchResponse = await askCaribbean(q);
    const results = searchResponse.results;
    const plan = searchResponse.plan;

    if (results.length === 0) {
      return NextResponse.json({
        answer: `No matching content, creators, or events found for "${q}" on Tukubi at this time.`,
        citations: [],
        plan,
      });
    }

    const aiEngine = new CaribAIEngine();
    let answerText = `Found ${results.length} verified item(s) on Tukubi for "${q}".`;
    const citations = results.slice(0, 5).map((r) => ({
      entityType: r.entityType,
      entityId: r.entityId,
      title: r.title,
    }));

    try {
      const prompt = `You are CaribAI, an intelligent assistant for TUKUBI — The Caribbean Connected.
User query: "${q}"
Retrieved Database Context:
${JSON.stringify(results.slice(0, 6), null, 2)}

Provide a concise, helpful summary directly based on the verified records above. Do NOT invent people, places, or events not present in the context. Return JSON with 'answer': string.`;

      const res = await aiEngine.complete(prompt);
      const jsonStr = res.substring(res.indexOf('{'), res.lastIndexOf('}') + 1);
      const parsed = JSON.parse(jsonStr);
      if (parsed.answer) {
        answerText = parsed.answer;
      }
    } catch {
      // Fallback to honest deterministic summary if AI provider is unconfigured or rate-limited
      answerText = `Here are the top matches found on Tukubi for "${q}": ${results.slice(0, 3).map((r) => r.title).join(', ')}.`;
    }

    return NextResponse.json({
      answer: answerText,
      citations,
      plan,
    });
  } catch (error) {
    console.error('AI Search Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
