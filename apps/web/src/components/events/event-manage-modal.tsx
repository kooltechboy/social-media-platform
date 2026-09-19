'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  X,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Ban,
  Settings,
} from 'lucide-react';
import {
  updateEventAction,
  cancelEventAction,
  deleteEventAction,
} from '../../lib/events/actions';

interface EventManageModalProps {
  event: {
    id: string;
    title: string;
    starts_at: string;
    venue: string | null;
    capacity: number | null;
    is_cancelled?: boolean;
    cancellation_reason?: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function EventManageModal({
  event,
  isOpen,
  onClose,
}: EventManageModalProps) {
  const router = useRouter();

  // Edit fields
  const [title, setTitle] = useState(event.title);
  const [venue, setVenue] = useState(event.venue || '');
  const [capacity, setCapacity] = useState(event.capacity ? String(event.capacity) : '');
  const [startsAt, setStartsAt] = useState(() => {
    try {
      const d = new Date(event.starts_at);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    } catch {
      return '';
    }
  });

  // Action states
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Cancellation state
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Deletion state
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('venue', venue);
    formData.append('startsAt', startsAt);
    formData.append('capacity', capacity);

    try {
      const res = await updateEventAction(event.id, formData);
      if (res.error) {
        setSaveError(res.error);
      } else {
        setSaveSuccess('Event updated successfully.');
        router.refresh();
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch {
      setSaveError('Failed to update event.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEvent = async () => {
    setIsCancelling(true);
    try {
      const res = await cancelEventAction(event.id, cancelReason);
      if (res.error) {
        alert(res.error);
      } else {
        router.refresh();
        onClose();
      }
    } catch {
      alert('Failed to cancel event.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this event? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteEventAction(event.id);
      if (res.error) {
        alert(res.error);
        setIsDeleting(false);
      } else {
        router.refresh();
        onClose();
      }
    } catch {
      alert('Failed to delete event.');
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-manage-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div className="w-full max-w-lg bg-brand-dusk border border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <h2 id="event-manage-title" className="text-lg font-black text-brand-sandstone">
              Host Controls
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {event.is_cancelled && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              This event is cancelled: {event.cancellation_reason || 'Cancelled by host.'}
            </span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {saveSuccess}
          </div>
        )}

        {saveError && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {saveError}
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-sandstone/80 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-brand-twilight border border-slate-700 text-brand-sandstone text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                Date &amp; Time *
              </label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-twilight border border-slate-700 text-brand-sandstone text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-sandstone/80 mb-1">
                Venue / Location
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Queen's Park Oval"
                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-twilight border border-slate-700 text-brand-sandstone text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-sandstone/80 mb-1">
              Capacity Limit (Optional)
            </label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Leave empty for unlimited"
              min="1"
              className="w-full px-3.5 py-2.5 rounded-xl bg-brand-twilight border border-slate-700 text-brand-sandstone text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:brightness-110 text-slate-950 font-black text-xs transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-amber-400/20"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Cancellation Section */}
        {!event.is_cancelled && (
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-brand-sandstone flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5 text-amber-400" /> Cancel Event
                </h3>
                <p className="text-[11px] text-brand-sandstone/60">
                  Notify attendees that the event is no longer taking place.
                </p>
              </div>
              {!showCancelPrompt && (
                <button
                  type="button"
                  onClick={() => setShowCancelPrompt(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel Event
                </button>
              )}
            </div>

            {showCancelPrompt && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3 animate-fadeIn">
                <label className="block text-xs font-bold text-amber-200">
                  Reason for Cancellation:
                </label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Inclement tropical weather / Rescheduled"
                  className="w-full px-3 py-2 rounded-xl bg-brand-twilight border border-slate-700 text-brand-sandstone text-xs focus:outline-none focus:border-amber-400"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCancelPrompt(false)}
                    className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs font-bold"
                  >
                    Keep Event
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEvent}
                    disabled={isCancelling}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delete Section */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-rose-400 flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Delete Event
            </h3>
            <p className="text-[11px] text-brand-sandstone/60">
              Permanently remove this event and delete all attendee bookings.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDeleteEvent}
            disabled={isDeleting}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
