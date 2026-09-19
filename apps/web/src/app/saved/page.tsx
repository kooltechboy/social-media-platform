import React from 'react';
import { redirect } from 'next/navigation';
import { Bookmark } from 'lucide-react';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import { hydratePostsEngagement } from '../../lib/feed/hydrate-posts';
import FeedStream, { type FeedPostData } from '../../components/feed-stream';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Saved Posts — TUKUBI',
  description: 'Your privately bookmarked Caribbean content.',
};

export default async function SavedPostsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/saved');

  const supabase = await createSupabaseServerClient();
  let savedPosts: FeedPostData[] = [];

  if (supabase) {
    const { data: saves } = await supabase
      .from('saved_posts')
      .select(`
        post_id,
        posts (
          id, content, created_at, visibility, likes_count, comments_count, shares_count, media_urls, cultural_tags, location_tag,
          profiles ( id, display_name, username, avatar_url, is_verified )
        )
      `)
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (saves) {
      const rawPosts = saves.filter((s: any) => s.posts).map((s: any) => s.posts);
      const hydrated = await hydratePostsEngagement(rawPosts, supabase, {
        currentUserId: user.id,
        includeHidden: true,
      });
      savedPosts = hydrated.map((p) => ({ ...p, isSaved: true }));
    }
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Bookmark className="w-6 h-6 text-brand-caribbeanSea" />
        <h1 className="text-2xl font-black text-brand-sandstone">Saved Posts</h1>
      </div>

      {savedPosts.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-brand-dusk/40 border border-slate-800 rounded-3xl space-y-3">
          <Bookmark className="w-10 h-10 mx-auto text-slate-600" />
          <p className="font-bold text-brand-sandstone">No saved posts yet.</p>
          <p className="text-sm">Tap the bookmark icon on any post to save it here.</p>
        </div>
      ) : (
        <FeedStream initialPosts={savedPosts} currentUserId={user.id} mode="saved" />
      )}
    </div>
  );
}
