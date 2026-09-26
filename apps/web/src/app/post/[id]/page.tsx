import React from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import { hydratePostsEngagement } from '../../../lib/feed/hydrate-posts';
import FeedStream, { type FeedPostData } from '../../../components/feed-stream';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      title: 'Post — TUKUBI',
      description: 'View post on TUKUBI — The Caribbean Connected.',
    };
  }

  const { data: post } = await supabase
    .from('posts')
    .select(`
      content, media_urls, link_preview,
      profiles!posts_author_id_fkey ( display_name, username )
    `)
    .eq('id', id)
    .maybeSingle();

  if (!post) {
    return {
      title: 'Post Not Found — TUKUBI',
      description: 'The requested post could not be found on TUKUBI.',
    };
  }

  const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
  const authorName = profile?.display_name || (profile?.username ? `@${profile.username}` : 'A Caribbean Member');
  const preview = post.link_preview as any;
  const snippet = post.content ? (post.content.length > 140 ? `${post.content.slice(0, 137)}...` : post.content) : 'Check out this post on TUKUBI.';
  const title = `${authorName} on TUKUBI`;
  const description = preview?.description || snippet;

  // Resolve best image for social preview
  let ogImage: string | undefined;
  if (Array.isArray(post.media_urls) && post.media_urls.length > 0) {
    ogImage = post.media_urls[0];
  } else if (preview?.thumbnail_url) {
    ogImage = preview.thumbnail_url;
  } else if (preview?.preview_image_url) {
    ogImage = preview.preview_image_url;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: 'TUKUBI — The Caribbean Connected',
      type: 'article',
      ...(ogImage ? { images: [{ url: ogImage, alt: title }] } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function SinglePostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      <div className="min-h-screen max-w-2xl mx-auto px-4 py-12 text-center text-slate-400">
        <p>Service unavailable. Please try again later.</p>
      </div>
    );
  }

  const { data: postRow, error } = await supabase
    .from('posts')
    .select(`
      id, content, created_at, visibility, likes_count, comments_count, shares_count, media_urls, cultural_tags, location_tag, link_preview, link_previews,
      profiles!posts_author_id_fkey ( id, display_name, username, avatar_url, is_verified )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error || !postRow) {
    return (
      <div className="min-h-screen max-w-2xl mx-auto px-4 py-12 space-y-6 text-center">
        <div className="p-8 surface-card rounded-3xl space-y-4">
          <MessageSquare className="w-12 h-12 mx-auto text-slate-600" />
          <h1 className="text-xl font-black text-brand-sandstone">Post Not Found</h1>
          <p className="text-sm text-brand-sandstone/70">
            This post may have been removed or is unavailable.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  const [postData] = await hydratePostsEngagement([postRow], supabase, {
    currentUserId: user?.id,
    includeHidden: true,
  });

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="p-2 rounded-xl hover:bg-white/5 text-brand-sandstone/80 hover:text-white transition"
          aria-label="Back to feed"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-black text-brand-sandstone">Post</h1>
      </div>

      <FeedStream
        initialPosts={[postData]}
        currentUserId={user?.id}
        mode="for_you"
      />
    </div>
  );
}