'use server';

import { CaribAIEngine } from '@caribbean/ai';
import { getCurrentUser, createSupabaseServerClient } from '../../lib/supabase/server';

export interface RepurposeResult {
  transcript?: string;        // AI-generated
  summary: string;             // 3-4 sentence summary
  quotedHighlights: string[];  // 5 pull quotes
  socialPosts: string[];       // 5 social post drafts
  contentIdeas: string[];      // 5 content ideas for Reels/stories
  hashtags: string[];          // 10 relevant hashtags
}

export async function repurposePodcastEpisodeAction(
  episodeId: string
): Promise<{ result: RepurposeResult | null; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { result: null, error: 'Unauthorized' };
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return { result: null, error: 'Database connection failed' };
    }

    // Fetch the episode
    const { data: episode, error: episodeError } = await supabase
      .from('podcast_episodes')
      .select('id, title, show_notes, duration_seconds')
      .eq('id', episodeId)
      .single();

    if (episodeError || !episode) {
      return { result: null, error: 'Episode not found' };
    }

    const prompt = `You are a content repurposing AI for TUKUBI, the Caribbean digital ecosystem.
Analyze this Caribbean podcast episode and produce content for social media.

Episode: ${episode.title}
Description: ${episode.show_notes || 'No description provided'}

Return JSON with this exact structure:
{
  "summary": "3-4 sentence executive summary",
  "quotedHighlights": ["quote 1", "quote 2", "quote 3", "quote 4", "quote 5"],
  "socialPosts": ["post 1", "post 2", "post 3", "post 4", "post 5"],
  "contentIdeas": ["reel idea 1", "reel idea 2", "reel idea 3", "reel idea 4", "reel idea 5"],
  "hashtags": ["#caribbean", "hashtag2", "hashtag3", "hashtag4", "hashtag5", "hashtag6", "hashtag7", "hashtag8", "hashtag9", "hashtag10"]
}

socialPosts should be under 280 chars each. Include Caribbean context and culture.`;

    const ai = new CaribAIEngine();
    const responseText = await ai.complete(prompt);

    // Extract JSON in case model includes markdown formatting
    let jsonStr = responseText;
    const match = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (match) {
      jsonStr = match[1];
    }

    const result = JSON.parse(jsonStr) as RepurposeResult;
    return { result };
  } catch (error: any) {
    console.error('Repurpose Error:', error);
    return { result: null, error: error.message || 'Failed to repurpose content' };
  }
}

export async function saveRepurposedContentAction(
  episodeId: string,
  result: RepurposeResult
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return { success: false, error: 'Database connection failed' };
    }

    // Verify ownership
    const { data: episode } = await supabase
      .from('podcast_episodes')
      .select('podcast_id, podcasts!inner(creator_id)')
      .eq('id', episodeId)
      .single();

    if (!episode || (episode as any).podcasts?.creator_id !== user.id) {
      return { success: false, error: 'Unauthorized to update this episode' };
    }

    const { error } = await supabase
      .from('podcast_episodes')
      .update({
        repurpose_result: result,
        repurposed_at: new Date().toISOString()
      })
      .eq('id', episodeId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to save repurposed content' };
  }
}
