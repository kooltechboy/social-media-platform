'use server';

import { CaribAIEngine } from '@caribbean/ai';
import { cookies } from 'next/headers';
import { checkRateLimit } from '../rate-limit/sliding-window';

/**
 * Resilient JSON extractor from LLM completion text.
 * Safely handles markdown fences, surrounding text commentary, and malformed outputs.
 */
export function extractJsonFromAiResponse<T>(raw: string): T | null {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const cleaned = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    return JSON.parse(cleaned.substring(start, end + 1)) as T;
  } catch {
    return null;
  }
}

export async function generateCaptionAction(draft: string): Promise<{ captions: string[]; error?: string }> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('sb-tukubi-auth-token')?.value || 'anonymous';
    
    // Enterprise sliding-window rate limiter check (api tier: 60 req/min)
    const rateLimit = await checkRateLimit(`ai:caption:${sessionId}`, 'api');
    if (!rateLimit.success) {
      return { captions: [], error: 'Please wait a moment before asking AI again.' };
    }

    const engine = new CaribAIEngine();
    const prompt = `You are TUKUBI's AI assistant for Caribbean creators. Generate 3 diverse caption options for this post. Return JSON: {"captions": ["string", "string", "string"]}. Post content: ${draft}`;
    
    const res = await engine.complete(prompt);
    const parsed = extractJsonFromAiResponse<{ captions?: string[] }>(res);
    
    if (!parsed || !Array.isArray(parsed.captions)) {
      return { captions: [], error: 'Failed to parse AI response.' };
    }

    return { captions: parsed.captions };
  } catch (error) {
    console.error('Caption generation error:', error);
    return { captions: [], error: 'Failed to generate captions.' };
  }
}

export async function generateHashtagsAction(draft: string): Promise<{ hashtags: string[]; error?: string }> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('sb-tukubi-auth-token')?.value || 'anonymous';
    
    // Enterprise sliding-window rate limiter check (api tier: 60 req/min)
    const rateLimit = await checkRateLimit(`ai:hashtags:${sessionId}`, 'api');
    if (!rateLimit.success) {
      return { hashtags: [], error: 'Please wait a moment before asking AI again.' };
    }

    const engine = new CaribAIEngine();
    const prompt = `Generate 8 Caribbean-relevant hashtags for this post. Return JSON: {"hashtags": ["string", "string"]}. Post: ${draft}`;
    
    const res = await engine.complete(prompt);
    const parsed = extractJsonFromAiResponse<{ hashtags?: string[] }>(res);

    if (!parsed || !Array.isArray(parsed.hashtags)) {
      return { hashtags: [], error: 'Failed to parse AI response.' };
    }

    return { hashtags: parsed.hashtags };
  } catch (error) {
    console.error('Hashtag generation error:', error);
    return { hashtags: [], error: 'Failed to generate hashtags.' };
  }
}

