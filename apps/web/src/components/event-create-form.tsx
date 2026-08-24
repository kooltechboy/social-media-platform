'use client';

import React, { useState, useTransition } from 'react';
import { createEventAction, type EventActionState } from '../lib/events/actions';

export interface CityOption {
  id: string;
  name: string;
  country_iso: string;
}

export default function EventCreateForm({ cities }: { cities: CityOption[] }) {
  const [state, setState] = useState<EventActionState>({ error: null });
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      void createEventAction(state, formData).then((next) => {
        setState(next);
        if (!next.error) setOpen(false);
      });
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-brand-caribbeanSea hover:bg-brand-caribbeanSea text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors"
      >
        Host an Event
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-brand-dusk/80 border border-slate-800 rounded-2xl p-5 space-y-3">
      <h3 className="text-sm font-bold text-brand-sandstone">Host a Caribbean Event</h3>
      <input
        name="title"
        required
        placeholder="Event title (e.g. Soca Night Brooklyn)"
        className="w-full bg-brand-twilight border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-brand-sandstone placeholder-brand-sandstone/40 focus:outline-none focus:border-brand-caribbeanSea transition-colors"
      />
      <div className="grid grid-cols-2 gap-3">
        <select
          name="eventKind"
          className="bg-brand-twilight border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-caribbeanSea"
        >
          <option value="in_person">In person</option>
          <option value="livestream">Livestream</option>
          <option value="hybrid">Hybrid</option>
        </select>
        <select
          name="cityId"
          className="bg-brand-twilight border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-caribbeanSea"
        >
          <option value="">Select a city…</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name} ({city.country_iso})
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input
          name="startsAt"
          type="datetime-local"
          required
          className="bg-brand-twilight border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-caribbeanSea"
        />
        <input
          name="capacity"
          type="number"
          min="1"
          placeholder="Capacity (optional)"
          className="bg-brand-twilight border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-brand-sandstone placeholder-brand-sandstone/40 focus:outline-none focus:border-brand-caribbeanSea"
        />
      </div>
      <input
        name="venue"
        placeholder="Venue (optional)"
        className="w-full bg-brand-twilight border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-brand-sandstone placeholder-brand-sandstone/40 focus:outline-none focus:border-brand-caribbeanSea transition-colors"
      />
      {state.error && (
        <p role="alert" className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">{state.error}</p>
      )}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-sandstone/60 hover:text-brand-sandstone transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="bg-brand-caribbeanSea hover:bg-brand-caribbeanSea disabled:opacity-60 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors"
        >
          {pending ? 'Publishing…' : 'Publish Event'}
        </button>
      </div>
    </form>
  );
}
