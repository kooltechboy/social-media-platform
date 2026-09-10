'use server';

import { CaribAIEngine } from '@caribbean/ai';
import { cookies } from 'next/headers';

// Simple in-memory rate limiting map for demo
const rateLimits = new Map<string, number>();

export async function generateCaptionAction(draft: string): Promise<{captions: string[]; error?: string}> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('sb-tukubi-auth-token')?.value || 'anonymous';
    const now = Date.now();
    const lastCall = rateLimits.get(`${sessionId}-caption`) || 0;
    
    if (now - lastCall < 10000) {
      return { captions: [], error: 'Please wait a moment before asking AI again.' };
    }
    rateLimits.set(`${sessionId}-caption`, now);

    const engine = new CaribAIEngine();
    const prompt = `You are TUKUBI's AI assistant for Caribbean creators. Generate 3 diverse caption options for this post. Return JSON: {"captions": ["string", "string", "string"]}. Post content: ${draft}`;
    
    const res = await engine.complete(prompt);
    
    // Extract JSON from response
    const jsonStr = res.substring(res.indexOf('{'), res.lastIndexOf('}') + 1);
    const parsed = JSON.parse(jsonStr);
    
    return { captions: parsed.captions || [] };
  } catch (error) {
    console.error('Caption generation error:', error);
    return { captions: [], error: 'Failed to generate captions.' };
  }
}

export async function generateHashtagsAction(draft: string): Promise<{hashtags: string[]; error?: string}> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('sb-tukubi-auth-token')?.value || 'anonymous';
    const now = Date.now();
    const lastCall = rateLimits.get(`${sessionId}-hashtags`) || 0;
    
    if (now - lastCall < 10000) {
      return { hashtags: [], error: 'Please wait a moment before asking AI again.' };
    }
    rateLimits.set(`${sessionId}-hashtags`, now);

    const engine = new CaribAIEngine();
    const prompt = `Generate 8 Caribbean-relevant hashtags for this post. Return JSON: {"hashtags": ["string", "string"]}. Post: ${draft}`;
    
    const res = await engine.complete(prompt);
    
    // Extract JSON from response
    const jsonStr = res.substring(res.indexOf('{'), res.lastIndexOf('}') + 1);
    const parsed = JSON.parse(jsonStr);
    
    return { hashtags: parsed.hashtags || [] };
  } catch (error) {
    console.error('Hashtag generation error:', error);
    return { hashtags: [], error: 'Failed to generate hashtags.' };
  }
}
