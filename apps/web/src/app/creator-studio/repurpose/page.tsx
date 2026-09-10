'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Copy, Video, CheckCircle2, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '../../../lib/supabase/browser';
import { repurposePodcastEpisodeAction, saveRepurposedContentAction, RepurposeResult } from '../../../lib/creator/repurpose-actions';

interface Episode {
  id: string;
  title: string;
  created_at: string;
  repurposed_at: string | null;
  repurpose_result: RepurposeResult | null;
}

export default function RepurposePage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<RepurposeResult | null>(null);
  const [error, setError] = useState('');
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  useEffect(() => {
    async function loadEpisodes() {
      try {
        if (!supabase) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data: podcasts } = await supabase
          .from('podcasts')
          .select('id')
          .eq('creator_id', session.user.id);

        if (!podcasts || podcasts.length === 0) {
          setLoading(false);
          return;
        }

        const podcastIds = podcasts.map((p: any) => p.id);

        const { data: eps } = await supabase
          .from('podcast_episodes')
          .select('id, title, created_at, repurposed_at, repurpose_result')
          .in('podcast_id', podcastIds)
          .order('created_at', { ascending: false })
          .limit(20);

        if (eps) {
          setEpisodes(eps as Episode[]);
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadEpisodes();
  }, [supabase]);

  const handleSelectEpisode = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedEpisodeId(id);
    const ep = episodes.find(ep => ep.id === id);
    if (ep && ep.repurpose_result) {
      setResult(ep.repurpose_result);
    } else {
      setResult(null);
    }
    setError('');
  };

  const handleGenerate = async () => {
    if (!selectedEpisodeId) return;
    setGenerating(true);
    setError('');
    
    try {
      const res = await repurposePodcastEpisodeAction(selectedEpisodeId);
      if (res.error) {
        setError(res.error);
      } else if (res.result) {
        setResult(res.result);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedEpisodeId || !result) return;
    setSaving(true);
    try {
      const res = await saveRepurposedContentAction(selectedEpisodeId, result);
      if (res.error) {
        setError(res.error);
      } else {
        // Update local state
        setEpisodes(prev => prev.map(ep => 
          ep.id === selectedEpisodeId 
            ? { ...ep, repurpose_result: result, repurposed_at: new Date().toISOString() } 
            : ep
        ));
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates({ ...copiedStates, [id]: true });
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const selectedEp = episodes.find(ep => ep.id === selectedEpisodeId);

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div className="surface-header p-6 sm:p-8 rounded-3xl flex flex-col gap-4 border border-white/15 shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-wider self-start">
          <Sparkles className="w-3.5 h-3.5" /> AI Content Engine
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Repurpose Podcast Episode
        </h1>
        <p className="text-sm text-brand-sandstone/80">
          Transform your long-form audio into social posts, quotes, and short-form video ideas using CaribAI.
        </p>
      </div>

      <div className="surface-card p-6 rounded-3xl border border-white/10 space-y-6">
        <div>
          <label className="block text-sm font-bold text-white mb-2">Select Episode</label>
          <select 
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50"
            value={selectedEpisodeId}
            onChange={handleSelectEpisode}
            disabled={loading || generating}
          >
            <option value="">-- Choose an episode --</option>
            {episodes.map(ep => (
              <option key={ep.id} value={ep.id}>
                {ep.title} {ep.repurposed_at ? ' (♻️ Repurposed)' : ''}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleGenerate}
            disabled={!selectedEpisodeId || generating}
            className="bg-brand-sunriseCoral hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black px-6 py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md flex-1"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> CaribAI is analyzing your episode... 🎙️</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate Content</>
            )}
          </button>
          
          {result && (
            <button
              onClick={handleSave}
              disabled={saving || (selectedEp?.repurposed_at !== null && selectedEp?.repurpose_result === result)}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all border border-white/10"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Results
            </button>
          )}
        </div>
      </div>

      {result && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Summary */}
          <div className="surface-card bg-[#140C22]/80 backdrop-blur border border-white/10 p-6 rounded-3xl space-y-3">
            <h3 className="text-lg font-black text-white">Executive Summary</h3>
            <p className="text-sm leading-relaxed text-brand-sandstone/90">{result.summary}</p>
          </div>

          {/* Quotes */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              Pull Quotes <span className="text-xs font-normal text-brand-sandstone/60 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">{result.quotedHighlights.length}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.quotedHighlights.map((quote: string, idx: number) => (
                <div key={idx} className="bg-gradient-to-br from-purple-900/40 to-slate-900/80 border border-purple-500/20 p-5 rounded-2xl flex flex-col justify-between gap-4">
                  <p className="text-base font-medium text-white italic">&ldquo;{quote}&rdquo;</p>
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => copyToClipboard(quote, `quote-${idx}`)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-brand-sandstone transition-colors"
                      title="Copy quote"
                    >
                      {copiedStates[`quote-${idx}`] ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <Link
                      href={`/create?mode=story&text=${encodeURIComponent(quote)}`}
                      className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold transition-colors border border-purple-500/30"
                    >
                      Create Story
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Social Posts */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              Social Posts <span className="text-xs font-normal text-brand-sandstone/60 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">{result.socialPosts.length}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.socialPosts.map((post: string, idx: number) => (
                <div key={idx} className="bg-[#140C22]/80 backdrop-blur border border-white/10 p-5 rounded-2xl flex flex-col justify-between gap-4">
                  <p className="text-sm text-brand-sandstone/90 whitespace-pre-wrap">{post}</p>
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => copyToClipboard(post, `post-${idx}`)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-brand-sandstone transition-colors"
                      title="Copy post"
                    >
                      {copiedStates[`post-${idx}`] ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <Link
                      href={`/create?content=${encodeURIComponent(post)}`}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold transition-colors border border-emerald-500/30"
                    >
                      Post Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content Ideas */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              Reel / Short Ideas <span className="text-xs font-normal text-brand-sandstone/60 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">{result.contentIdeas.length}</span>
            </h3>
            <div className="surface-card bg-[#140C22]/80 backdrop-blur border border-white/10 p-6 rounded-3xl">
              <ul className="space-y-4">
                {result.contentIdeas.map((idea: string, idx: number) => (
                  <li key={idx} className="flex gap-3 items-start pb-4 border-b border-white/5 last:border-0 last:pb-0">
                    <Video className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-brand-sandstone/90 leading-relaxed">{idea}</p>
                      <Link
                        href="/create?mode=reel"
                        className="inline-block mt-2 text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors"
                      >
                        Create Reel →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Hashtags */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-white">Suggested Hashtags</h3>
            <div className="flex flex-wrap gap-2">
              {result.hashtags.map((tag: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => copyToClipboard(tag, `tag-${idx}`)}
                  className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-brand-sandstone transition-colors flex items-center gap-1.5"
                >
                  {tag}
                  {copiedStates[`tag-${idx}`] && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
