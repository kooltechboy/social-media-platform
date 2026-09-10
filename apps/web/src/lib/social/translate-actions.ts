'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { CaribAIEngine } from '@caribbean/ai';
import crypto from 'crypto';

export async function translatePostAction(
  postId: string,
  content: string,
  targetLocale: string
): Promise<{ translation: string | null; error?: string }> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // Next 15 readonly cookies constraint in actions workaround
          },
          remove(name: string, options: any) {
            // Next 15 readonly cookies constraint in actions workaround
          },
        },
      }
    );

    const contentHash = crypto.createHash('sha256').update(content).digest('hex');

    // 1. Check Cache
    const { data: cached, error: cacheError } = await supabase
      .from('content_translations_cache')
      .select('translated_text')
      .eq('content_hash', contentHash)
      .eq('target_language', targetLocale)
      .maybeSingle();

    if (cached?.translated_text) {
      return { translation: cached.translated_text };
    }

    // 2. Call AI
    const aiEngine = new CaribAIEngine();
    const translatedText = await aiEngine.translateContent(content, targetLocale);

    if (translatedText) {
      // 3. Store in cache
      await supabase.from('content_translations_cache').insert({
        content_hash: contentHash,
        source_language: 'auto',
        target_language: targetLocale,
        original_text: content,
        translated_text: translatedText,
        provider: 'caribai',
      });
      return { translation: translatedText };
    }

    return { translation: null, error: 'Translation failed' };
  } catch (error: any) {
    console.error('Translation error:', error);
    return { translation: null, error: 'AI Service Unavailable' };
  }
}
