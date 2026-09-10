'use client';
/**
 * GoLivePanel — Creator UI for starting a live stream via Cloudflare Stream
 * Shows the RTMPS URL + stream key after creation, plus an HLS preview player.
 * If LIVE_CDN_NOT_CONFIGURED, shows an informational banner.
 */
import React, { useState } from 'react';
import { Radio, Eye, EyeOff, Copy, CheckCheck, X } from 'lucide-react';
import { createLiveStreamAction, endLiveStreamAction } from '../../lib/live/stream-actions';

interface GoLivePanelProps {
  creatorId: string;
}

export default function GoLivePanel({ creatorId: _creatorId }: GoLivePanelProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [streamKey, setStreamKey] = useState<{
    streamId: string; rtmpsUrl: string; rtmpsKey: string; playbackHlsUrl: string;
  } | null>(null);
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [copied, setCopied] = useState<'url' | 'key' | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [error, setError] = useState('');

  async function handleGoLive() {
    if (!title.trim()) return;
    setIsSubmitting(true);
    setError('');
    const result = await createLiveStreamAction({ title: title.trim(), description: description.trim() || undefined });
    setIsSubmitting(false);

    if (result.error === 'LIVE_CDN_NOT_CONFIGURED') {
      setNotConfigured(true);
      return;
    }
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.streamId && result.rtmpsUrl && result.rtmpsKey && result.playbackHlsUrl) {
      setStreamKey({
        streamId: result.streamId,
        rtmpsUrl: result.rtmpsUrl,
        rtmpsKey: result.rtmpsKey,
        playbackHlsUrl: result.playbackHlsUrl,
      });
      setShowKeyForm(false);
    }
  }

  async function handleEndStream() {
    if (!streamKey) return;
    await endLiveStreamAction(streamKey.streamId);
    setStreamKey(null);
    setTitle('');
    setDescription('');
  }

  async function copyToClipboard(text: string, field: 'url' | 'key') {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  }

  if (notConfigured) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-300 space-y-2">
        <p className="font-bold text-sm">⚙️ Live Streaming Not Configured</p>
        <p className="text-xs text-amber-300/80 leading-relaxed">
          Live streaming requires Cloudflare Stream credentials. An administrator must set{' '}
          <code className="font-mono bg-black/30 px-1 rounded">CLOUDFLARE_ACCOUNT_ID</code> and{' '}
          <code className="font-mono bg-black/30 px-1 rounded">CLOUDFLARE_STREAM_API_TOKEN</code>{' '}
          in the server environment. See{' '}
          <a href="https://developers.cloudflare.com/stream/stream-live/" target="_blank" rel="noopener noreferrer" className="underline">
            Cloudflare Stream Docs
          </a>{' '}
          for setup instructions.
        </p>
        <button onClick={() => setNotConfigured(false)} className="text-xs text-amber-300/60 hover:text-amber-300 flex items-center gap-1">
          <X className="w-3 h-3" /> Dismiss
        </button>
      </div>
    );
  }

  if (streamKey) {
    return (
      <div className="space-y-4">
        {/* Active stream indicator */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-black text-red-400 uppercase tracking-widest">Stream Active</span>
          <span className="text-xs text-white/50">— {title}</span>
        </div>

        {/* RTMPS credentials */}
        <div className="space-y-3 rounded-2xl bg-[#0A1024]/80 border border-white/10 p-4">
          <p className="text-xs font-bold text-white/60 uppercase tracking-wider">OBS / Mobile Setup</p>
          
          <div className="space-y-1">
            <label className="text-xs text-white/50">RTMPS URL</label>
            <div className="flex items-center gap-2 bg-black/40 rounded-xl px-3 py-2">
              <code className="flex-1 text-xs text-brand-caribbeanSea font-mono truncate">{streamKey.rtmpsUrl}</code>
              <button onClick={() => copyToClipboard(streamKey.rtmpsUrl, 'url')} className="text-white/50 hover:text-white transition-colors" aria-label="Copy RTMPS URL">
                {copied === 'url' ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-white/50">Stream Key</label>
            <div className="flex items-center gap-2 bg-black/40 rounded-xl px-3 py-2">
              <code className="flex-1 text-xs text-brand-sunriseCoral font-mono truncate">
                {isKeyVisible ? streamKey.rtmpsKey : '•'.repeat(Math.min(streamKey.rtmpsKey.length, 24))}
              </code>
              <button onClick={() => setIsKeyVisible(!isKeyVisible)} className="text-white/50 hover:text-white transition-colors" aria-label={isKeyVisible ? 'Hide stream key' : 'Show stream key'}>
                {isKeyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={() => copyToClipboard(streamKey.rtmpsKey, 'key')} className="text-white/50 hover:text-white transition-colors" aria-label="Copy stream key">
                {copied === 'key' ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-white/30">Never share your stream key publicly.</p>
          </div>
        </div>

        {/* HLS Preview player */}
        <div className="space-y-1">
          <p className="text-xs font-bold text-white/60 uppercase tracking-wider">Live Preview</p>
          <video
            src={streamKey.playbackHlsUrl}
            controls
            autoPlay
            playsInline
            muted
            className="w-full aspect-video rounded-2xl bg-black/60"
            aria-label="Live stream preview"
          />
          <p className="text-xs text-white/30">Preview may take 15–30 seconds to appear after going live in OBS.</p>
        </div>

        {/* End stream */}
        <button
          onClick={handleEndStream}
          className="w-full rounded-2xl border border-red-500/40 bg-red-500/10 text-red-400 font-bold text-sm py-3 hover:bg-red-500/20 transition-colors"
        >
          End Stream
        </button>
      </div>
    );
  }

  if (!showKeyForm) {
    return (
      <button
        onClick={() => setShowKeyForm(true)}
        className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour px-5 py-3 text-white font-black text-sm shadow-lg shadow-brand-sunriseCoral/30 hover:scale-[1.02] transition-transform"
        aria-label="Go live"
      >
        <Radio className="w-4 h-4 animate-pulse" /> Go Live
      </button>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl bg-[#0A1024]/80 border border-white/10 p-5">
      <div className="flex items-center justify-between">
        <p className="font-black text-sm text-white">Start a Live Stream</p>
        <button onClick={() => setShowKeyForm(false)} className="text-white/40 hover:text-white" aria-label="Cancel">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="live-title" className="text-xs text-white/60 font-bold uppercase tracking-wide block mb-1">Title *</label>
          <input
            id="live-title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Friday Night Vibes from Kingston 🎵"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-brand-caribbeanSea"
            maxLength={120}
            required
          />
        </div>
        <div>
          <label htmlFor="live-desc" className="text-xs text-white/60 font-bold uppercase tracking-wide block mb-1">Description</label>
          <textarea
            id="live-desc"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Tell viewers what this stream is about..."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-brand-caribbeanSea resize-none"
            rows={2}
            maxLength={300}
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleGoLive}
        disabled={!title.trim() || isSubmitting}
        className="w-full rounded-2xl bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour text-white font-black text-sm py-3 disabled:opacity-50 hover:scale-[1.01] transition-transform shadow-lg shadow-brand-sunriseCoral/20"
      >
        {isSubmitting ? 'Creating stream...' : '🔴 Go Live'}
      </button>
    </div>
  );
}
