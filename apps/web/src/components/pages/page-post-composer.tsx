'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { Send, Image as ImageIcon, Hash, Loader2, Sparkles, Link2 } from 'lucide-react';
import { createPagePostAction } from '../../lib/pages/actions';
import { detectUrls, type ResolvedContentMetadata } from '@caribbean/media';
import MultiLinkContainer from '../media/multi-link-container';

interface PagePostComposerProps {
  pageId: string;
  pageName: string;
}

export default function PagePostComposer({ pageId, pageName }: PagePostComposerProps) {
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [linkPreviews, setLinkPreviews] = useState<ResolvedContentMetadata[]>([]);
  const [dismissedUrls, setDismissedUrls] = useState<Set<string>>(new Set());
  const [isResolvingUrl, setIsResolvingUrl] = useState(false);
  const [isPending, startTransition] = useTransition();
  const abortRef = useRef<AbortController | null>(null);

  // Real-time debounced URL resolution
  useEffect(() => {
    const combinedText = `${content} ${mediaUrlInput}`.trim();
    if (!combinedText) {
      if (abortRef.current) abortRef.current.abort();
      setIsResolvingUrl(false);
      return;
    }

    const detected = detectUrls(combinedText);
    if (!detected.hasUrls) return;

    const urlsToResolve = detected.urls.filter(
      (u) =>
        !dismissedUrls.has(u) &&
        !linkPreviews.some((p) => p.url === u || p.normalizedUrl === u)
    );

    if (urlsToResolve.length === 0) return;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timer = setTimeout(async () => {
      setIsResolvingUrl(true);
      try {
        for (const targetUrl of urlsToResolve) {
          if (controller.signal.aborted) break;
          const res = await fetch('/api/v1/media/resolve-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: targetUrl }),
            signal: controller.signal,
          });
          if (res.ok && !controller.signal.aborted) {
            const data = await res.json();
            if (data?.metadata) {
              setLinkPreviews((prev) => {
                if (prev.some((p) => p.normalizedUrl === data.metadata.normalizedUrl)) {
                  return prev;
                }
                return [...prev, data.metadata];
              });
            }
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          // Non-fatal resolution warning
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsResolvingUrl(false);
        }
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [content, mediaUrlInput, dismissedUrls, linkPreviews]);

  const handleRemovePreview = (index: number) => {
    const target = linkPreviews[index];
    if (target) {
      setDismissedUrls((prev) => new Set([...prev, target.url, target.normalizedUrl]));
    }
    setLinkPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && !mediaUrlInput.trim() && linkPreviews.length === 0) return;

    setStatusMessage(null);
    startTransition(async () => {
      try {
        const tags = tagInput
          .split(',')
          .map((t) => t.trim().replace(/^#/, ''))
          .filter(Boolean);

        const media = mediaUrlInput.trim() ? [mediaUrlInput.trim()] : [];

        const res = await createPagePostAction(
          pageId,
          content,
          tags,
          media,
          linkPreviews[0] || null,
          linkPreviews
        );

        if (res.error) {
          setStatusMessage({ type: 'error', text: res.error });
        } else {
          setContent('');
          setTagInput('');
          setMediaUrlInput('');
          setLinkPreviews([]);
          setShowMediaInput(false);
          setShowTagInput(false);
          setStatusMessage({ type: 'success', text: 'Published post to Page!' });
        }
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: err?.message || 'Failed to publish post.' });
      }
    });
  }

  return (
    <div className="surface-card rounded-3xl p-5 sm:p-6 border border-brand-sunriseCoral/30 shadow-xl space-y-4 text-left">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-brand-sunriseCoral flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Post as {pageName}
        </span>
        <span className="text-[10px] font-bold text-brand-sandstone/60">Official Publishing</span>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-2xl text-xs font-bold ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handlePublish} className="space-y-3">
        <textarea
          rows={3}
          value={content}
          onChange={(e) => {
            if (statusMessage) setStatusMessage(null);
            setContent(e.target.value);
          }}
          placeholder={`Share an update, announcement, or new release from ${pageName}...`}
          className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-brand-sandstone/40 text-xs sm:text-sm focus:outline-none focus:border-brand-sunriseCoral transition-colors resize-none"
        />

        {showMediaInput && (
          <input
            type="url"
            value={mediaUrlInput}
            onChange={(e) => {
              if (statusMessage) setStatusMessage(null);
              setMediaUrlInput(e.target.value);
            }}
            placeholder="Photo or Video URL (https://...)"
            className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-brand-sandstone/40 text-xs focus:outline-none focus:border-brand-sunriseCoral transition-colors"
          />
        )}

        {showTagInput && (
          <input
            type="text"
            value={tagInput}
            onChange={(e) => {
              if (statusMessage) setStatusMessage(null);
              setTagInput(e.target.value);
            }}
            placeholder="Cultural tags (comma separated: soca, carnival, reggae, islandeats)..."
            className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-brand-sandstone/40 text-xs focus:outline-none focus:border-brand-sunriseCoral transition-colors"
          />
        )}

        {/* Live Multi-Link Previews */}
        {linkPreviews.length > 0 && (
          <div className="pt-2">
            <MultiLinkContainer
              previews={linkPreviews}
              onRemovePreview={handleRemovePreview}
            />
          </div>
        )}

        {isResolvingUrl && (
          <div className="flex items-center gap-2 text-[11px] text-brand-caribbeanSea font-bold px-2 py-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Resolving universal link preview...</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMediaInput(!showMediaInput)}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                showMediaInput || mediaUrlInput
                  ? 'bg-brand-caribbeanSea/20 text-brand-caribbeanSea border-brand-caribbeanSea/40'
                  : 'bg-white/5 text-brand-sandstone/70 hover:text-white border-white/5'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Media</span>
            </button>
            <button
              type="button"
              onClick={() => setShowTagInput(!showTagInput)}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                showTagInput || tagInput
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                  : 'bg-white/5 text-brand-sandstone/70 hover:text-white border-white/5'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Tags</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isPending || (!content.trim() && !mediaUrlInput.trim() && linkPreviews.length === 0)}
            className="px-5 py-2.5 rounded-2xl bg-brand-sunriseCoral hover:brightness-110 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Publish</span>
          </button>
        </div>
      </form>
    </div>
  );
}
