'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Subtitles,
  Sparkles,
  Download,
  Copy,
  Check,
  Play,
  Pause,
  RotateCcw,
  Globe,
  Sliders,
  FileText,
  Languages,
} from 'lucide-react';
import {
  type CaribbeanDialect,
  CARIBBEAN_DIALECT_DETAILS,
  detectCaribbeanDialect,
} from '@caribbean/localization';
import {
  type CaptionTrack,
  type CaptionCue,
  generateDialectCaptions,
  exportToWebVTT,
  formatTimestampVTT,
  findActiveCue,
} from '@caribbean/media';

interface DialectCaptionGeneratorProps {
  initialTranscript?: string;
  defaultDurationSec?: number;
  onSaveTrack?: (track: CaptionTrack) => void;
  className?: string;
}

const SAMPLE_SNIPPETS: Array<{
  label: string;
  dialect: CaribbeanDialect;
  text: string;
  duration: number;
}> = [
  {
    label: '🇯🇲 Jamaican Reggae / Dancehall Vibe',
    dialect: 'jam',
    text: 'Wah gwaan world! Big up all mi bredren and sistren holding a vibe in Kingston tonight. Di riddim loud, di energy proper criss, soon come with more fire!',
    duration: 30,
  },
  {
    label: '🇭🇹 Haitian Kreyòl Diaspora Tale',
    dialect: 'ht',
    text: 'Sak pase Ayiti! Jodi a se yon bèl jou pou nou reyini ansanm nan dyaspora a. Kilti nou bèl anpil, manje nou bon nèt, kenbe la pa lage!',
    duration: 30,
  },
  {
    label: '🇨🇼 Papiamentu ABC Islands Spotlight',
    dialect: 'pap',
    text: 'Bon bini na nos dushi isla! Con ta bay ku boso tur awe? Nos ta selebra e hendenan kreativo di Karibe ku hopi amor i orguyo.',
    duration: 30,
  },
  {
    label: '🇹🇹 Trinidad Carnival Mas Lime',
    dialect: 'tri',
    text: 'Aye, how yuh doin lime! Carnival season reach, steelband sweet down in Port of Spain, jump up inna band with we!',
    duration: 25,
  },
];

export default function DialectCaptionGenerator({
  initialTranscript = '',
  defaultDurationSec = 30,
  onSaveTrack,
  className = '',
}: DialectCaptionGeneratorProps) {
  const [transcript, setTranscript] = useState(initialTranscript || SAMPLE_SNIPPETS[0].text);
  const [selectedDialect, setSelectedDialect] = useState<CaribbeanDialect | 'auto'>('auto');
  const [durationSec, setDurationSec] = useState<number>(defaultDurationSec);
  const [captionTrack, setCaptionTrack] = useState<CaptionTrack | null>(null);
  const [copied, setCopied] = useState(false);

  // Playback simulation state
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Auto-detect dialect from input text
  const detectedInfo = detectCaribbeanDialect(transcript);
  const effectiveDialect: CaribbeanDialect =
    selectedDialect === 'auto' ? detectedInfo.dialect : selectedDialect;

  // Generate captions when transcript or settings change
  const handleGenerate = () => {
    if (!transcript.trim()) return;
    const track = generateDialectCaptions(
      transcript,
      durationSec,
      selectedDialect === 'auto' ? undefined : selectedDialect
    );
    setCaptionTrack(track);
    setCurrentTime(0);
    setIsPlaying(false);
    onSaveTrack?.(track);
  };

  // Initial generation
  useEffect(() => {
    if (transcript.trim() && !captionTrack) {
      handleGenerate();
    }
  }, []);

  // Playback timer simulation loop
  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();
      const tick = (now: number) => {
        if (lastTimeRef.current !== null) {
          const deltaSec = (now - lastTimeRef.current) / 1000;
          setCurrentTime((prev) => {
            const next = prev + deltaSec;
            if (next >= durationSec) {
              setIsPlaying(false);
              return 0;
            }
            return next;
          });
        }
        lastTimeRef.current = now;
        animationFrameRef.current = requestAnimationFrame(tick);
      };
      animationFrameRef.current = requestAnimationFrame(tick);
    } else {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      lastTimeRef.current = null;
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, durationSec]);

  const activeCue = captionTrack ? findActiveCue(captionTrack.cues, currentTime) : null;

  const handleDownloadWebVTT = () => {
    if (!captionTrack) return;
    const vttContent = exportToWebVTT(captionTrack);
    const blob = new Blob([vttContent], { type: 'text/vtt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tukubi-${effectiveDialect}-captions.vtt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyWebVTT = () => {
    if (!captionTrack) return;
    const vttContent = exportToWebVTT(captionTrack);
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(vttContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLoadSnippet = (snippet: (typeof SAMPLE_SNIPPETS)[0]) => {
    setTranscript(snippet.text);
    setSelectedDialect(snippet.dialect);
    setDurationSec(snippet.duration);
    const track = generateDialectCaptions(snippet.text, snippet.duration, snippet.dialect);
    setCaptionTrack(track);
    setCurrentTime(0);
    setIsPlaying(false);
    onSaveTrack?.(track);
  };

  return (
    <div
      className={`rounded-2xl bg-brand-dusk/90 border border-slate-800 p-4 md:p-6 shadow-2xl space-y-6 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Subtitles className="w-5 h-5 text-brand-caribbeanSea" /> Caribbean Dialect
            Auto-Caption Studio
          </h2>
          <p className="text-xs text-brand-sandstone/70 mt-1">
            Generate authentic timestamp-synchronized WebVTT subtitles with Caribbean linguistic
            markers (Patwa, Kreyòl, Papiamentu, and more).
          </p>
        </div>

        {captionTrack && captionTrack.cues.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyWebVTT}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
              title="Copy WebVTT code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied VTT' : 'Copy VTT'}
            </button>
            <button
              type="button"
              onClick={handleDownloadWebVTT}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md hover:brightness-110 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Download .vtt
            </button>
          </div>
        )}
      </div>

      {/* Preset Snippets */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-brand-sandstone/80 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" /> Quick Caribbean Presets:
        </label>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_SNIPPETS.map((snip) => (
            <button
              key={snip.label}
              type="button"
              onClick={() => handleLoadSnippet(snip)}
              className="px-2.5 py-1 rounded-lg text-xs bg-brand-twilight/60 hover:bg-brand-twilight border border-white/10 hover:border-brand-coralPink/50 text-white/90 transition-all cursor-pointer"
            >
              {snip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Transcript Input */}
        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="dialect-transcript"
              className="text-xs font-bold text-white flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-brand-coralPink" /> Video Spoken Audio / Transcript
            </label>
            <span className="text-[11px] text-brand-sandstone/60">
              Detected:{' '}
              <strong className="text-brand-caribbeanSea uppercase">
                {detectedInfo.dialect} ({Math.round(detectedInfo.confidence * 100)}% match)
              </strong>
            </span>
          </div>
          <textarea
            id="dialect-transcript"
            rows={4}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste audio dialogue, speech lyrics, or episode notes..."
            className="w-full bg-[#0B0F1A] border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-coralPink focus:ring-1 focus:ring-brand-coralPink"
          />
        </div>

        {/* Controls */}
        <div className="space-y-4 bg-[#0B0F1A] border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div>
              <label
                htmlFor="target-dialect"
                className="text-xs font-bold text-white block mb-1 flex items-center gap-1.5"
              >
                <Languages className="w-3.5 h-3.5 text-brand-goldenHour" /> Dialect Engine Target
              </label>
              <select
                id="target-dialect"
                value={selectedDialect}
                onChange={(e) => setSelectedDialect(e.target.value as CaribbeanDialect | 'auto')}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-brand-caribbeanSea cursor-pointer"
              >
                <option value="auto">⚡ Auto-Detect Caribbean Dialect</option>
                {Object.entries(CARIBBEAN_DIALECT_DETAILS).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.flag} {meta.name} ({meta.nativeName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Clip Duration
                </span>
                <span className="font-mono text-brand-goldenHour">{durationSec}s</span>
              </div>
              <input
                type="range"
                min="5"
                max="180"
                step="5"
                value={durationSec}
                onChange={(e) => setDurationSec(Number(e.target.value))}
                className="w-full accent-brand-coralPink cursor-pointer"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-sunriseCoral to-rose-500 hover:brightness-110 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> Synthesize Subtitles
          </button>
        </div>
      </div>

      {/* Subtitle Real-time Overlay Preview Simulation */}
      {captionTrack && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Subtitle Timeline &amp; Preview
            </h3>
            <span className="text-xs font-mono text-brand-sandstone/70">
              {formatTimestampVTT(currentTime)} / {formatTimestampVTT(durationSec)}
            </span>
          </div>

          {/* Video Preview Canvas Simulation */}
          <div className="relative aspect-video max-h-48 rounded-xl bg-gradient-to-b from-[#181124] to-[#0A0D14] border border-slate-800 overflow-hidden flex flex-col justify-between p-4 shadow-inner">
            <div className="flex items-center justify-between text-[11px] text-white/50">
              <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10 font-mono">
                {captionTrack.label}
              </span>
              <span className="text-[10px] text-brand-goldenHour">
                {captionTrack.cues.length} Sync Cues
              </span>
            </div>

            {/* Active Subtitle Overlay */}
            <div className="flex flex-col items-center justify-center px-4 py-2 text-center">
              {activeCue ? (
                <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-2xl max-w-lg transition-all animate-fade-in">
                  <p className="text-sm font-black text-white drop-shadow-md tracking-wide">
                    {activeCue.text}
                  </p>
                  {activeCue.translations?.en && activeCue.dialect !== 'jam' && (
                    <p className="text-[11px] text-brand-goldenHour mt-0.5 italic">
                      EN: {activeCue.translations.en}
                    </p>
                  )}
                </div>
              ) : (
                <span className="text-xs text-white/30 italic">[No speech at this timestamp]</span>
              )}
            </div>

            {/* Playback Controls & Progress Bar */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-8 h-8 rounded-full bg-brand-coralPink text-white flex items-center justify-center shrink-0 shadow hover:brightness-110 cursor-pointer"
                aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentTime(0);
                  setIsPlaying(false);
                }}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-white/80 flex items-center justify-center shrink-0 cursor-pointer"
                aria-label="Restart simulation"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
              <input
                type="range"
                min="0"
                max={durationSec}
                step="0.1"
                value={currentTime}
                onChange={(e) => {
                  setCurrentTime(Number(e.target.value));
                  setIsPlaying(false);
                }}
                className="w-full accent-brand-caribbeanSea cursor-pointer"
              />
            </div>
          </div>

          {/* Synchronized Cues Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-brand-coralPink" /> Timestamp Cue Breakdown
            </h4>
            <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-800 bg-[#090D16] divide-y divide-slate-800/60">
              {captionTrack.cues.map((cue, idx) => {
                const isActive =
                  currentTime >= cue.startTimeSec && currentTime <= cue.endTimeSec;
                return (
                  <div
                    key={cue.id}
                    onClick={() => {
                      setCurrentTime(cue.startTimeSec);
                      setIsPlaying(false);
                    }}
                    className={`p-3 text-xs flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-brand-coralPink/15 border-l-4 border-brand-coralPink text-white'
                        : 'hover:bg-slate-800/40 text-brand-sandstone/80'
                    }`}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-brand-caribbeanSea">
                          {formatTimestampVTT(cue.startTimeSec)} → {formatTimestampVTT(cue.endTimeSec)}
                        </span>
                        {cue.dialect && (
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-brand-twilight text-brand-sandstone border border-white/10">
                            {cue.dialect}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-white/95">{cue.text}</p>
                      {cue.translations?.en && cue.translations.en !== cue.text && (
                        <p className="text-[11px] text-brand-goldenHour/80">
                          Translation: {cue.translations.en}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-white/40 shrink-0">
                      Cue #{idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
