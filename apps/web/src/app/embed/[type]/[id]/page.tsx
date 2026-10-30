import React from 'react';
import { createSupabaseServerClient } from '../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

interface EmbedPageProps {
  params: Promise<{
    type: string;
    id: string;
  }>;
}

export default async function EmbedViewerPage({ params }: EmbedPageProps) {
  const { type, id } = await params;
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://tukubi.com').replace(/\/$/, '');

  let title = 'Discover Caribbean culture, authentic stories, music, and diaspora craft on TUKUBI.';
  let authorName = 'Tukubi Member';
  let authorHandle = 'tukubi';
  let subtitle = 'Caribbean Basin & Diaspora';
  let targetUrl = `${baseUrl}/${type === 'post' ? 'post' : type}/${id}`;

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      if (type === 'post') {
        const { data: post } = await supabase
          .from('posts')
          .select('content, profiles!posts_author_id_fkey(display_name, username)')
          .eq('id', id)
          .maybeSingle();
        if (post) {
          title = post.content || title;
          const prof = (post as any).profiles;
          if (prof?.display_name) authorName = prof.display_name;
          if (prof?.username) authorHandle = prof.username;
          targetUrl = `${baseUrl}/post/${id}`;
        }
      } else if (type === 'marketplace' || type === 'product') {
        const { data: prod } = await supabase
          .from('products')
          .select('title, price_minor, currency, businesses(name, slug)')
          .eq('id', id)
          .maybeSingle();
        if (prod) {
          title = `${prod.title} — $${((prod.price_minor || 0) / 100).toFixed(2)} ${prod.currency || 'USD'}`;
          const biz = (prod as any).businesses;
          if (biz?.name) authorName = biz.name;
          if (biz?.slug) authorHandle = biz.slug;
          targetUrl = `${baseUrl}/marketplace/${id}`;
        }
      } else if (type === 'spaces') {
        const { data: space } = await supabase
          .from('sound_lounges')
          .select('title, topic, profiles!sound_lounges_host_id_fkey(display_name, username)')
          .eq('id', id)
          .maybeSingle();
        if (space) {
          title = space.title;
          if (space.topic) subtitle = space.topic;
          const prof = (space as any).profiles;
          if (prof?.display_name) authorName = prof.display_name;
          if (prof?.username) authorHandle = prof.username;
          targetUrl = `${baseUrl}/explore`;
        }
      }
    }
  } catch {
    // Non-blocking fallback
  }

  const typeLabels: Record<string, string> = {
    spaces: '🎙️ Live Audio Lounge',
    marketplace: '🛍️ Island Marketplace',
    product: '🛍️ Island Marketplace',
    post: '🌴 Caribbean Voice',
  };

  return (
    <div className="w-full h-full min-h-[360px] p-4 bg-[#070D1A] text-[#E8EDF5] flex flex-col justify-between font-sans antialiased box-border">
      {/* Top Author & Brand Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#15213A]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#F2775A] via-[#F4AE45] to-[#8B5CF6] flex items-center justify-center font-bold text-sm text-white">
            {authorName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-sm text-white">{authorName}</p>
            <p className="text-[11px] text-[#0EA5E9]">@{authorHandle} • {subtitle}</p>
          </div>
        </div>

        <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">
          {type}
        </span>
      </div>

      {/* Main Content Showcase */}
      <div className="my-4 p-4 rounded-xl bg-[#0D1628] border border-[#15213A] space-y-2">
        <span className="text-xs font-semibold text-[#F2775A] uppercase tracking-wider">
          {typeLabels[type] || '🌴 Caribbean Moment'}
        </span>
        <h2 className="text-sm sm:text-base font-bold text-white line-clamp-3 leading-relaxed">
          {title}
        </h2>
        <p className="text-[10px] text-[#E8EDF5]/50 font-mono">Verified TUKUBI Publication</p>
      </div>

      {/* Footer Branding & Call to Action */}
      <div className="pt-3 border-t border-[#15213A] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-[#F2775A] to-[#F4AE45] bg-clip-text text-transparent">
            TUKUBI
          </span>
          <span className="text-[11px] text-[#E8EDF5]/50">• The Caribbean Connected</span>
        </div>

        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#F2775A] text-white hover:opacity-90 transition-opacity"
        >
          View on Tukubi →
        </a>
      </div>
    </div>
  );
}