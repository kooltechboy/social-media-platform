'use client';

import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Globe,
  Users,
  Lock,
  X,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type { CreateEventInput, EventKind, EventPrivacy } from '../../lib/events/types';

export interface EventComposerPanelProps {
  value: CreateEventInput;
  onChange: (val: CreateEventInput) => void;
  className?: string;
  onRemove?: () => void;
}

export default function EventComposerPanel({
  value,
  onChange,
  className = '',
  onRemove,
}: EventComposerPanelProps) {
  const isInvalidDates = Boolean(
    value.starts_at &&
    value.ends_at &&
    new Date(value.ends_at).getTime() < new Date(value.starts_at).getTime()
  );

  const handleFieldChange = <K extends keyof CreateEventInput>(
    field: K,
    newVal: CreateEventInput[K]
  ) => {
    onChange({
      ...value,
      [field]: newVal,
    });
  };

  return (
    <div
      className={`p-4 rounded-2xl bg-brand-twilight/90 border border-brand-goldenHour/30 space-y-4 animate-fadeIn shadow-lg ${className}`}
      data-testid="event-composer-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand-goldenHour/10 text-brand-goldenHour border border-brand-goldenHour/20">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs md:text-sm font-bold text-brand-goldenHour flex items-center gap-1.5">
              Caribbean Event Details
            </h4>
            <p className="text-[11px] text-brand-sandstone/60">
              Set date, venue, livestream link, and capacity for your community
            </p>
          </div>
        </div>

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove event"
            className="text-brand-sandstone/40 hover:text-brand-sandstone text-xs flex items-center gap-1 min-h-[44px] min-w-[44px] justify-center rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Remove</span>
          </button>
        )}
      </div>

      {/* Date Validation Error Alert */}
      {isInvalidDates && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Validation Error: Event end time must be after start time.</span>
        </div>
      )}

      {/* Event Title */}
      <div>
        <label
          htmlFor="event-title-input"
          className="block text-xs font-semibold text-brand-sandstone/80 mb-1"
        >
          Event Title *
        </label>
        <input
          id="event-title-input"
          type="text"
          value={value.title || ''}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          placeholder="e.g. Kingston Reggae & Soca Sunsplash"
          required
          aria-required="true"
          className="w-full bg-brand-dusk border border-slate-800 focus:border-brand-goldenHour focus:ring-1 focus:ring-brand-goldenHour rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-brand-sandstone focus:outline-none min-h-[44px] transition-all"
        />
      </div>

      {/* Dates & Times */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="event-starts-at"
            className="block text-xs font-semibold text-brand-sandstone/80 mb-1 flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-brand-goldenHour" /> Starts At *
          </label>
          <input
            id="event-starts-at"
            type="datetime-local"
            value={value.starts_at || ''}
            onChange={(e) => handleFieldChange('starts_at', e.target.value)}
            required
            aria-required="true"
            className="w-full bg-brand-dusk border border-slate-800 focus:border-brand-goldenHour focus:ring-1 focus:ring-brand-goldenHour rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-brand-sandstone focus:outline-none min-h-[44px] transition-all"
          />
        </div>

        <div>
          <label
            htmlFor="event-ends-at"
            className="block text-xs font-semibold text-brand-sandstone/80 mb-1 flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-brand-goldenHour" /> Ends At (Optional)
          </label>
          <input
            id="event-ends-at"
            type="datetime-local"
            value={value.ends_at || ''}
            onChange={(e) => handleFieldChange('ends_at', e.target.value)}
            className="w-full bg-brand-dusk border border-slate-800 focus:border-brand-goldenHour focus:ring-1 focus:ring-brand-goldenHour rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-brand-sandstone focus:outline-none min-h-[44px] transition-all"
          />
        </div>
      </div>

      {/* Format & Privacy Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="event-format-select"
            className="block text-xs font-semibold text-brand-sandstone/80 mb-1"
          >
            Event Format
          </label>
          <select
            id="event-format-select"
            value={value.event_kind || 'in_person'}
            onChange={(e) => handleFieldChange('event_kind', e.target.value as EventKind)}
            className="w-full bg-brand-dusk border border-slate-800 focus:border-brand-goldenHour focus:ring-1 focus:ring-brand-goldenHour rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-brand-sandstone focus:outline-none min-h-[44px] transition-all"
          >
            <option value="in_person">In-Person Gathering</option>
            <option value="livestream">Livestream Broadcast</option>
            <option value="hybrid">Hybrid (In-Person & Livestream)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="event-privacy-select"
            className="block text-xs font-semibold text-brand-sandstone/80 mb-1"
          >
            Audience & Privacy
          </label>
          <select
            id="event-privacy-select"
            value={value.privacy || 'public'}
            onChange={(e) => handleFieldChange('privacy', e.target.value as EventPrivacy)}
            className="w-full bg-brand-dusk border border-slate-800 focus:border-brand-goldenHour focus:ring-1 focus:ring-brand-goldenHour rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-brand-sandstone focus:outline-none min-h-[44px] transition-all"
          >
            <option value="public">Public (Open to All)</option>
            <option value="community_only">Community Members Only</option>
            <option value="invite_only">Invite Only</option>
          </select>
        </div>
      </div>

      {/* Venue & Livestream URLs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(value.event_kind === 'in_person' || value.event_kind === 'hybrid' || !value.event_kind) && (
          <div>
            <label
              htmlFor="event-venue-input"
              className="block text-xs font-semibold text-brand-sandstone/80 mb-1 flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-brand-goldenHour" /> Venue / Address
            </label>
            <input
              id="event-venue-input"
              type="text"
              value={value.venue || ''}
              onChange={(e) => handleFieldChange('venue', e.target.value)}
              placeholder="e.g. Queen's Park Savannah, Port of Spain"
              className="w-full bg-brand-dusk border border-slate-800 focus:border-brand-goldenHour focus:ring-1 focus:ring-brand-goldenHour rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-brand-sandstone focus:outline-none min-h-[44px] transition-all"
            />
          </div>
        )}

        {(value.event_kind === 'livestream' || value.event_kind === 'hybrid') && (
          <div>
            <label
              htmlFor="event-livestream-url-input"
              className="block text-xs font-semibold text-brand-sandstone/80 mb-1 flex items-center gap-1.5"
            >
              <Video className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Livestream URL
            </label>
            <input
              id="event-livestream-url-input"
              type="url"
              value={value.livestream_url || ''}
              onChange={(e) => handleFieldChange('livestream_url', e.target.value)}
              placeholder="https://youtube.com/live/..."
              className="w-full bg-brand-dusk border border-slate-800 focus:border-brand-caribbeanSea focus:ring-1 focus:ring-brand-caribbeanSea rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-brand-sandstone focus:outline-none min-h-[44px] transition-all"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="event-capacity-input"
            className="block text-xs font-semibold text-brand-sandstone/80 mb-1 flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-brand-goldenHour" /> Capacity (Max Attendees)
          </label>
          <input
            id="event-capacity-input"
            type="number"
            min="1"
            value={value.capacity ?? ''}
            onChange={(e) => {
              const val = e.target.value ? parseInt(e.target.value, 10) : null;
              handleFieldChange('capacity', Number.isNaN(val) ? null : val);
            }}
            placeholder="Unlimited if empty"
            className="w-full bg-brand-dusk border border-slate-800 focus:border-brand-goldenHour focus:ring-1 focus:ring-brand-goldenHour rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-brand-sandstone focus:outline-none min-h-[44px] transition-all"
          />
        </div>
      </div>
    </div>
  );
}
