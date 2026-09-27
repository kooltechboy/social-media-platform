'use client';

import React from 'react';
import {
  RotateCw,
  FlipHorizontal,
  Sliders,
  Sparkles,
  Crop,
  Check,
  RotateCcw,
} from 'lucide-react';
import { CanvasCompositor, type PhotoEditState } from '@caribbean/media';

export interface PhotoEditorProps {
  imageSrc: string;
  initialState?: Partial<PhotoEditState>;
  initialTab?: 'presets' | 'adjust' | 'crop';
  onSave: (finalState: PhotoEditState) => void;
  onCancel: () => void;
}

export const CARIBBEAN_PRESETS: Array<{
  id: PhotoEditState['filter'];
  label: string;
  tagline: string;
}> = [
  { id: 'none', label: 'Original', tagline: 'Natural unprocessed image' },
  { id: 'caribbean_warmth', label: 'Warm Sun', tagline: 'Tropical sunrise warmth and soft sepia' },
  { id: 'golden_hour', label: 'Golden Hour', tagline: 'Sunset glow with rich golden tones' },
  { id: 'twilight_purple', label: 'Twilight', tagline: 'Vibrant dusk violet with saturated highlights' },
  { id: 'sea_clarity', label: 'Sea Clarity', tagline: 'Crisp turquoise Caribbean sea pop' },
  { id: 'monochrome', label: 'Monochrome', tagline: 'Classic high-contrast black and white' },
];

export const ASPECT_RATIOS: Array<PhotoEditState['aspectRatio']> = [
  'free',
  '1:1',
  '4:5',
  '9:16',
  '16:9',
];

export const DEFAULT_PHOTO_EDIT_STATE: PhotoEditState = {
  crop: { x: 0, y: 0, width: 0, height: 0 },
  aspectRatio: '1:1',
  rotationDeg: 0,
  flipHorizontal: false,
  filter: 'none',
  brightness: 0,
  contrast: 0,
  saturation: 0,
  altText: '',
};

const compositor = new CanvasCompositor();

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

export default function PhotoEditor({
  imageSrc,
  initialState,
  initialTab = 'presets',
  onSave,
  onCancel,
}: PhotoEditorProps) {
  const [editState, setEditState] = useSafeState<PhotoEditState>(() => ({
    ...DEFAULT_PHOTO_EDIT_STATE,
    ...initialState,
  }));

  const [activeTab, setActiveTab] = useSafeState<'presets' | 'adjust' | 'crop'>(initialTab);

  const rotate = () => {
    setEditState((prev) => {
      const nextRotation = ((prev.rotationDeg + 90) % 360) as PhotoEditState['rotationDeg'];
      return { ...prev, rotationDeg: nextRotation };
    });
  };

  const toggleFlip = () => {
    setEditState((prev) => ({
      ...prev,
      flipHorizontal: !prev.flipHorizontal,
    }));
  };

  const resetAdjustments = () => {
    setEditState((prev) => ({
      ...prev,
      brightness: 0,
      contrast: 0,
      saturation: 0,
    }));
  };

  const filterString = compositor.buildFilterString(editState);

  const getAspectClass = (ratio: PhotoEditState['aspectRatio']) => {
    switch (ratio) {
      case '1:1':
        return 'aspect-square max-h-[65vh]';
      case '4:5':
        return 'aspect-[4/5] max-h-[65vh]';
      case '9:16':
        return 'aspect-[9/16] max-h-[65vh]';
      case '16:9':
        return 'aspect-[16/9] max-h-[65vh]';
      case 'free':
      default:
        return 'max-h-[65vh]';
    }
  };

  return (
    <div
      role="region"
      aria-label="Photo studio editor"
      className="relative w-full h-full flex flex-col bg-slate-950 text-white select-none overflow-hidden"
    >
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900/80 backdrop-blur-md z-20">
        <button
          type="button"
          onClick={onCancel}
          className="text-white/70 hover:text-white px-2 py-1 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-wide">Photo Studio</span>
          <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-brand-goldenHour/20 text-brand-goldenHour border border-brand-goldenHour/30">
            {editState.filter !== 'none' ? editState.filter.replace('_', ' ') : 'Live'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onSave(editState)}
          className="px-3.5 py-1.5 bg-brand-goldenHour text-black font-semibold text-xs rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Check className="w-3.5 h-3.5" />
          Apply
        </button>
      </div>

      {/* Image Preview Canvas / Viewport */}
      <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden bg-black/60">
        <div
          className={`relative overflow-hidden rounded-lg flex items-center justify-center border border-white/10 shadow-2xl transition-all duration-200 ${getAspectClass(
            editState.aspectRatio
          )}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={editState.altText || 'Captured photo preview'}
            className="max-w-full max-h-full object-contain transition-all duration-200"
            style={{
              transform: `rotate(${editState.rotationDeg}deg) scaleX(${editState.flipHorizontal ? -1 : 1})`,
              filter: filterString,
            }}
          />

          {/* Guide Overlay for Non-free aspect ratios */}
          {editState.aspectRatio !== 'free' && (
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none border border-white/20 grid grid-cols-3 grid-rows-3 opacity-30"
            >
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-white/20" />
              <div className="border-r border-white/20" />
              <div />
            </div>
          )}
        </div>
      </div>

      {/* Editor Sub-Navigation & Controls */}
      <div className="p-4 border-t border-white/10 bg-slate-900/95 backdrop-blur-md z-10 flex flex-col gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-center gap-6 text-xs font-semibold border-b border-white/5 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`pb-1 flex items-center gap-1.5 transition-colors ${
              activeTab === 'presets'
                ? 'text-brand-goldenHour border-b-2 border-brand-goldenHour font-bold'
                : 'text-white/60 hover:text-white/90'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Caribbean Filters
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('adjust')}
            className={`pb-1 flex items-center gap-1.5 transition-colors ${
              activeTab === 'adjust'
                ? 'text-brand-goldenHour border-b-2 border-brand-goldenHour font-bold'
                : 'text-white/60 hover:text-white/90'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Adjustments
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('crop')}
            className={`pb-1 flex items-center gap-1.5 transition-colors ${
              activeTab === 'crop'
                ? 'text-brand-goldenHour border-b-2 border-brand-goldenHour font-bold'
                : 'text-white/60 hover:text-white/90'
            }`}
          >
            <Crop className="w-3.5 h-3.5" />
            Crop & Aspect
          </button>
        </div>

        {/* Tab 1: Caribbean Presets */}
        {activeTab === 'presets' && (
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {CARIBBEAN_PRESETS.map((p) => {
              const isSelected = editState.filter === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setEditState((prev) => ({ ...prev, filter: p.id }))}
                  className={`px-3 py-2 rounded-xl text-xs whitespace-nowrap font-medium transition-all flex flex-col items-start gap-0.5 ${
                    isSelected
                      ? 'bg-brand-goldenHour text-black font-semibold shadow-md'
                      : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10'
                  }`}
                >
                  <span className="text-xs">{p.label}</span>
                  <span
                    className={`text-[9px] ${isSelected ? 'text-black/70' : 'text-white/40'}`}
                  >
                    {p.id === 'none' ? 'Natural' : p.id.replace('caribbean_', '')}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 2: Adjustments */}
        {activeTab === 'adjust' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-white/80">
              <span className="w-20">Brightness</span>
              <input
                type="range"
                min="-50"
                max="50"
                value={editState.brightness}
                onChange={(e) =>
                  setEditState((prev) => ({ ...prev, brightness: Number(e.target.value) }))
                }
                aria-label="Brightness"
                className="flex-1 mx-3 accent-brand-goldenHour cursor-pointer"
              />
              <span className="w-8 text-right font-mono text-white/60">
                {editState.brightness > 0 ? `+${editState.brightness}` : editState.brightness}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-white/80">
              <span className="w-20">Contrast</span>
              <input
                type="range"
                min="-50"
                max="50"
                value={editState.contrast}
                onChange={(e) =>
                  setEditState((prev) => ({ ...prev, contrast: Number(e.target.value) }))
                }
                aria-label="Contrast"
                className="flex-1 mx-3 accent-brand-goldenHour cursor-pointer"
              />
              <span className="w-8 text-right font-mono text-white/60">
                {editState.contrast > 0 ? `+${editState.contrast}` : editState.contrast}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-white/80">
              <span className="w-20">Saturation</span>
              <input
                type="range"
                min="-50"
                max="50"
                value={editState.saturation}
                onChange={(e) =>
                  setEditState((prev) => ({ ...prev, saturation: Number(e.target.value) }))
                }
                aria-label="Saturation"
                className="flex-1 mx-3 accent-brand-goldenHour cursor-pointer"
              />
              <span className="w-8 text-right font-mono text-white/60">
                {editState.saturation > 0 ? `+${editState.saturation}` : editState.saturation}
              </span>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={resetAdjustments}
                className="text-[11px] text-white/50 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset adjustments
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Crop & Aspect */}
        {activeTab === 'crop' && (
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={rotate}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs flex items-center gap-1.5 hover:bg-white/10 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Rotate 90°
              </button>
              <button
                type="button"
                onClick={toggleFlip}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs flex items-center gap-1.5 hover:bg-white/10 transition-colors"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                Flip
              </button>
            </div>
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              {ASPECT_RATIOS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setEditState((prev) => ({ ...prev, aspectRatio: r }))}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    editState.aspectRatio === r
                      ? 'bg-brand-goldenHour text-black'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {r === 'free' ? 'Free' : r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* WCAG Accessibility Alt-Text Field */}
        <div className="mt-1 pt-2 border-t border-white/5">
          <label
            htmlFor="photo-alt-input"
            className="block text-[11px] font-medium text-white/70 mb-1"
          >
            Image Description (Screen Reader Alt Text)
          </label>
          <input
            id="photo-alt-input"
            type="text"
            role="textbox"
            aria-label="Image description for screen readers (alt text)"
            placeholder="Accessibility alt text (description for screen readers)..."
            value={editState.altText}
            onChange={(e) =>
              setEditState((prev) => ({ ...prev, altText: e.target.value }))
            }
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-brand-goldenHour transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
