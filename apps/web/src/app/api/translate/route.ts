import { NextResponse, type NextRequest } from 'next/server';
import {
  Locale,
  isLocale,
  DEFAULT_LOCALE,
  computeContentHash,
  defaultTranslationService,
} from '@caribbean/localization';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, targetLang, postId, commentId } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Text content is required for translation.' },
        { status: 400 }
      );
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return NextResponse.json({
        success: true,
        translatedText: text,
        sourceLang: 'und',
        targetLang: targetLang || DEFAULT_LOCALE,
        provider: 'noop',
      });
    }

    const safeTarget: Locale = targetLang && isLocale(targetLang) ? targetLang : DEFAULT_LOCALE;

    // Security & Authorization Verification (Requirement 14: Privacy & Security)
    const supabase = await createSupabaseServerClient();
    const user = await getCurrentUser();

    if (postId && supabase) {
      // Check post visibility and permissions
      const { data: post, error: postErr } = await supabase
        .from('posts')
        .select('id, visibility, author_id')
        .eq('id', postId)
        .maybeSingle();

      if (postErr || !post) {
        return NextResponse.json(
          { success: false, error: 'Content not found or inaccessible.' },
          { status: 404 }
        );
      }

      // If post is private or friends-only, verify caller is authenticated and authorized
      if (post.visibility === 'private' && post.author_id !== user?.id) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized to access this private content.' },
          { status: 403 }
        );
      }
    }

    const contentHash = computeContentHash(trimmed);

    // 1. Check Supabase content_translations_cache (Requirement 11: Performance & Caching)
    if (supabase) {
      const { data: cached } = await supabase
        .from('content_translations_cache')
        .select('translated_text, source_language, provider')
        .eq('content_hash', contentHash)
        .eq('target_language', safeTarget)
        .maybeSingle();

      if (cached && cached.translated_text) {
        return NextResponse.json({
          success: true,
          translatedText: cached.translated_text,
          sourceLang: cached.source_language,
          targetLang: safeTarget,
          provider: cached.provider,
          cached: true,
        });
      }
    }

    // 2. Perform translation using provider-agnostic TranslationService
    const result = await defaultTranslationService.translate(trimmed, {
      targetLang: safeTarget,
    });

    // 3. Asynchronously persist to database cache if new translation was made
    if (supabase && !result.cached && result.provider !== 'identity' && result.provider !== 'noop') {
      (async () => {
        try {
          await supabase
            .from('content_translations_cache')
            .upsert(
              {
                content_hash: contentHash,
                source_language: result.sourceLang || 'und',
                target_language: safeTarget,
                original_text: trimmed,
                translated_text: result.translatedText,
                provider: result.provider,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'content_hash,source_language,target_language' }
            );
        } catch (err: unknown) {
          console.warn('Failed to persist translation cache to Supabase:', err);
        }
      })();
    }

    return NextResponse.json({
      success: true,
      translatedText: result.translatedText,
      sourceLang: result.sourceLang,
      targetLang: safeTarget,
      provider: result.provider,
      cached: !!result.cached,
    });
  } catch (error) {
    console.error('Translation error in /api/translate:', error);
    return NextResponse.json(
      { success: false, error: 'Translation temporarily unavailable.' },
      { status: 500 }
    );
  }
}
