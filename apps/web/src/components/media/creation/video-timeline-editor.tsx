'use client';
/* eslint-disable react-hooks/rules-of-hooks */

import React, { useRef } from 'react';
import {
  Play,
  Pause,
  Music,
  Check,
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
} from 'lucide-react';
import type { RecordedClip, VideoEditState } from '@caribbean/media';
import { CARIBBEAN_SOUNDS, type CaribbeanSound } from '../../../lib/constants/caribbean-sounds';

export interface VideoTimelineEditorProps {
  clips: RecordedClip[];
  initialState?: Partial<VideoEditState>;
  initialShowSoundPicker?: boolean;
  onSave: (finalState: VideoEditState) => void;
  onCancel: () => void;
}

export const DEFAULT_VIDEO_EDIT_STATE: VideoEditState = {
  clips: [],
  selectedSoundId: undefined,
  selectedSoundTitle: undefined,
  selectedSoundUrl: undefined,
  soundVolume: 80,
  micVolume: 100,
  activeFilter: 'none',
  textOverlays: [],
  coverTimestampMs: 0,
};

export function reorderClips(
  clips: RecordedClip[],
  fromIndex: number,
  toIndex: number
): RecordedClip[] {
  if (
    fromIndex < 0 ||
    fromIndex >= clips.length ||
    toIndex < 0 ||
    toIndex >= clips.length ||
    fromIndex === toIndex
  ) {
    return [...clips];
  }
  const result = [...clips];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result.map((c, i) => ({ ...c, order: i }));
}

export function nudgeClip(
  clips: RecordedClip[],
  index: number,
  direction: -1 | 1
): RecordedClip[] {
  return reorderClips(clips, index, index + direction);
}

function useSafeState<T>(initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  const internals =
    (React as any)?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
    (React as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const dispatcher = internals?.H || internals?.ReactCurrentDispatcher?.current;

  if (dispatcher) {
    return React.useState<T>(initialValue);
  }
  const val = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
  return [val, () => {}];
}

function useSafeRef<T>(initialValue: T): React.RefObject<T> {
  const internals =
    (React as any)?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
    (React as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const dispatcher = internals?.H || internals?.ReactCurrentDispatcher?.current;

  if (dispatcher) {
    return React.useRef<T>(initialValue);
  }
  return { current: initialValue };
}

export default function VideoTimelineEditor({
  clips: initialClips,
  initialState,
  initialShowSoundPicker = false,
  onSave,
  onCancel,
}: VideoTimelineEditorProps) {
  const [clips, setClips] = useSafeState<RecordedClip[]>(initialClips);
  const [selectedClipId, setSelectedClipId] = useSafeState<string>(
    initialClips[0]?.id || ''
  );
  const [isPlaying, setIsPlaying] = useSafeState<boolean>(false);
  const [soundVolume, setSoundVolume] = useSafeState<number>(
    initialState?.soundVolume ?? DEFAULT_VIDEO_EDIT_STATE.soundVolume
  );
  const [micVolume, setMicVolume] = useSafeState<number>(
    initialState?.micVolume ?? DEFAULT_VIDEO_EDIT_STATE.micVolume
  );
  const [selectedSound, setSelectedSound] = useSafeState<CaribbeanSound | null>(() => {
    if (initialState?.selectedSoundId) {
      return CARIBBEAN_SOUNDS.find((s) => s.id === initialState.selectedSoundId) || null;
    }
    return null;
  });
  const [showSoundPicker, setShowSoundPicker] = useSafeState<boolean>(initialShowSoundPicker);
  const [coverTimestampMs, setCoverTimestampMs] = useSafeState<number>(
    initialState?.coverTimestampMs ?? DEFAULT_VIDEO_EDIT_STATE.coverTimestampMs
  );

  const previewVideoRef = useSafeRef<HTMLVideoElement | null>(null);
  const activeClip = clips.find((c) => c.id === selectedClipId) || clips[0];
  const totalDurationMs = clips.reduce((acc, c) => acc + (c.durationMs || 0), 0);

  const togglePlay = () => {
    if (!previewVideoRef.current) return;
    if (isPlaying) {
      previewVideoRef.current.pause();
      setIsPlaying(false);
    } else {
      previewVideoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  const handleNudge = (idx: number, direction: -1 | 1) => {
    const updated = nudgeClip(clips, idx, direction);
    setClips(updated);
  };

  const handleApply = () => {
    onSave({
      clips,
      selectedSoundId: selectedSound?.id,
      selectedSoundTitle: selectedSound?.title,
      selectedSoundUrl: selectedSound?.audioUrl,
      soundVolume,
      micVolume,
      activeFilter: initialState?.activeFilter || 'none',
      textOverlays: initialState?.textOverlays || [],
      coverTimestampMs,
    });
  };

  return (
    <div
      role="region"
      aria-label="Video timeline editor"
      className="w-full h-full flex flex-col bg-slate-950 text-white select-none"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 z-10">
        <button
          type="button"
          onClick={onCancel}
          className="text-white/60 hover:text-white p-2 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        <span className="text-sm font-bold tracking-wide">Video / Reel Studio</span>
        <button
          type="button"
          onClick={handleApply}
          className="px-3.5 py-1.5 bg-brand-goldenHour text-black font-semibold text-xs rounded-xl hover:opacity-90 flex items-center gap-1.5 transition-opacity"
        >
          <Check className="w-3.5 h-3.5" />
          Done
        </button>
      </div>

      {/* Main Video Viewport Preview */}
      <div className="flex-1 relative flex items-center justify-center p-4 bg-black/60 overflow-hidden">
        {activeClip ? (
          <video
            ref={previewVideoRef}
            src={activeClip.previewUrl}
            playsInline
            loop
            className="max-w-full max-h-full object-contain rounded-xl"
            onEnded={() => setIsPlaying(false)}
          />
        ) : (
          <span className="text-white/40 text-xs">No clip recorded</span>
        )}

        {/* Play / Pause Floating Overlay */}
        <button
          type="button"
          aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/20 active:scale-95 transition-transform"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 fill-current" />
          ) : (
            <Play className="w-6 h-6 fill-current translate-x-0.5" />
          )}
        </button>
      </div>

      {/* Bottom Timeline Controls */}
      <div className="p-4 border-t border-white/10 bg-slate-900/95 space-y-3">
        {/* Multi-Clip Segment Sequence */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>
              Clip Timeline ({clips.length} segments)
            </span>
            <button
              type="button"
              aria-label="Add Caribbean Sound"
              onClick={() => setShowSoundPicker(!showSoundPicker)}
              className="text-brand-goldenHour flex items-center gap-1 font-semibold"
            >
              <Music className="w-3.5 h-3.5" />
              {selectedSound ? selectedSound.title : 'Add Caribbean Sound'}
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto py-1.5 scrollbar-none">
            {clips.map((c, idx) => (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                aria-label={`Clip segment ${idx + 1}`}
                onClick={() => setSelectedClipId(c.id)}
                className={`relative px-3 py-2 rounded-lg border text-xs cursor-pointer flex items-center gap-2 ${
                  c.id === activeClip?.id
                    ? 'border-brand-goldenHour bg-amber-500/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <span>
                  Take {idx + 1} ({(c.durationMs / 1000).toFixed(1)}s)
                </span>
                {idx > 0 && (
                  <button
                    type="button"
                    aria-label={`Move clip ${idx + 1} earlier`}
                    onClick={(e) => {
                      e?.stopPropagation?.();
                      handleNudge(idx, -1);
                    }}
                    className="text-white/40 hover:text-white"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                )}
                {idx < clips.length - 1 && (
                  <button
                    type="button"
                    aria-label={`Move clip ${idx + 1} later`}
                    onClick={(e) => {
                      e?.stopPropagation?.();
                      handleNudge(idx, 1);
                    }}
                    className="text-white/40 hover:text-white"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Dual-Track Volume Sliders */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5 text-xs text-white/70">
          <div className="flex items-center justify-between">
            <span>Camera Audio</span>
            <input
              type="range"
              min="0"
              max="100"
              aria-label="Camera audio volume"
              value={micVolume}
              onChange={(e) => setMicVolume(Number(e.target.value))}
              className="w-24 accent-brand-goldenHour"
            />
          </div>
          <div className="flex items-center justify-between">
            <span>Rhythm Stem</span>
            <input
              type="range"
              min="0"
              max="100"
              aria-label="Rhythm stem volume"
              value={soundVolume}
              onChange={(e) => setSoundVolume(Number(e.target.value))}
              className="w-24 accent-brand-goldenHour"
            />
          </div>
        </div>

        {/* Cover Frame Scrubber */}
        <div className="pt-2 border-t border-white/5 text-xs text-white/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <ImageIcon className="w-3.5 h-3.5 text-brand-goldenHour" />
            <span>
              Cover Frame: {(coverTimestampMs / 1000).toFixed(1)}s
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={Math.max(0, totalDurationMs)}
            step="100"
            aria-label="Cover frame scrubber"
            value={coverTimestampMs}
            onChange={(e) => setCoverTimestampMs(Number(e.target.value))}
            className="flex-1 accent-brand-goldenHour"
          />
        </div>

        {/* Sound Picker Dropdown if Active */}
        {showSoundPicker && (
          <div
            role="region"
            aria-label="Caribbean sound picker"
            className="p-3 bg-black/60 rounded-xl border border-white/10 max-h-40 overflow-y-auto space-y-1"
          >
            <button
              type="button"
              aria-label="No Sound"
              onClick={() => {
                setSelectedSound(null);
                setShowSoundPicker(false);
              }}
              className="w-full text-left text-xs p-1.5 rounded hover:bg-white/10 text-white/60"
            >
              None (Original Audio Only)
            </button>
            {CARIBBEAN_SOUNDS.slice(0, 10).map((snd) => (
              <button
                key={snd.id}
                type="button"
                aria-label={`Select ${snd.title} by ${snd.artist}`}
                onClick={() => {
                  setSelectedSound(snd);
                  setShowSoundPicker(false);
                }}
                className={`w-full text-left text-xs p-1.5 rounded hover:bg-white/10 flex items-center justify-between ${
                  selectedSound?.id === snd.id
                    ? 'text-brand-goldenHour font-bold'
                    : 'text-white/90'
                }`}
              >
                <span>
                  {snd.title} • {snd.artist}
                </span>
                <span className="text-[10px] text-white/50">{snd.bpm} BPM</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
