'use server';

import { CaribAIEngine } from '@caribbean/ai';
import { cookies } from 'next/headers';

const rateLimits = new Map<string, number>();

export async function creatorAIInsightAction(
  question: string,
  creatorContext: {postsCount: number, followersCount: number, recentEngagement: number}
): Promise<{insight: string; error?: string}> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('sb-tukubi-auth-token')?.value || 'anonymous';
    const now = Date.now();
    const lastCall = rateLimits.get(`${sessionId}-creatorAI`) || 0;
    
    if (now - lastCall < 10000) {
      return { insight: '', error: 'Please wait a moment before asking AI again.' };
    }
    rateLimits.set(`${sessionId}-creatorAI`, now);

    const engine = new CaribAIEngine();
    const prompt = `You are TUKUBI's Creator AI for Caribbean creators. 
Context: ${creatorContext.followersCount} followers, ${creatorContext.postsCount} posts, recent engagement rate: ${creatorContext.recentEngagement}%. 
Question: ${question}

Provide a concise, helpful, and insightful answer targeted at helping this creator grow and engage their audience.`;
    
    const res = await engine.complete(prompt);
    
    return { insight: res };
  } catch (error) {
    console.error('Creator AI Insight error:', error);
    return { insight: '', error: 'Failed to generate AI insight.' };
  }
}
