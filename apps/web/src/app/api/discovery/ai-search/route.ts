import { NextResponse } from 'next/server';
import { AskCaribbeanPlanner, CaribAIEngine } from '@caribbean/ai';
import { cookies } from 'next/headers';

const rateLimits = new Map<string, number>();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    
    if (!q) {
      return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
    }

    // Simple rate limiting
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('sb-tukubi-auth-token')?.value || 'anonymous';
    const now = Date.now();
    const lastCall = rateLimits.get(`${sessionId}-search`) || 0;
    
    if (now - lastCall < 6000) { // 10 searches per minute -> ~6 seconds between searches
      return NextResponse.json({ error: 'Rate limit exceeded. Please wait a moment.' }, { status: 429 });
    }
    rateLimits.set(`${sessionId}-search`, now);

    const planner = new AskCaribbeanPlanner();
    const plan = planner.plan(q);

    const aiEngine = new CaribAIEngine();
    
    // Simulate grounded retrieval based on the plan
    const prompt = `You are an AI assistant for a Caribbean social platform. 
User query: "${q}"
Plan: ${JSON.stringify(plan)}
Please provide a helpful, concise answer based on this query. If the query asks for events, creators, or businesses, invent a few realistic examples for the Caribbean context. Return a JSON object with 'answer' and 'citations' (array of {entityType, entityId, title}).`;

    const res = await aiEngine.complete(prompt);
    let parsed: any;
    try {
      const jsonStr = res.substring(res.indexOf('{'), res.lastIndexOf('}') + 1);
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = { answer: 'AI is thinking...', citations: [] };
    }

    return NextResponse.json({
      answer: parsed.answer || 'No answer generated.',
      citations: parsed.citations || [],
      plan,
    });
  } catch (error) {
    console.error('AI Search Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
