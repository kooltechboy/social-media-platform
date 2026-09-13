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
        className="bg-brand-caribbeanSea hover:brightness-110 text-slate-950 font-bold px-5 md:px-6 py-2.5 md:py-3 rounded-xl text-xs md:text-sm transition-all min-h-[42px] md:min-h-[46px]"
      >
        Host an Event
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-brand-dusk/80 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-3.5">
      <h3 className="text-sm md:text-base font-black text-brand-sandstone">Host a Caribbean Event</h3>
      <input
        name="title"
        required
        placeholder="Event title (e.g. Soca Night Brooklyn)"
        className="w-full bg-brand-twilight border border-slate-800 rounded-xl px-4 py-2.5 md:py-3 text-sm md:text-base text-brand-sandstone placeholder-brand-sandstone/40 focus:outline-none focus:border-brand-caribbeanSea transition-colors min-h-[42px] md:min-h-[46px]"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select
          name="eventKind"
          className="bg-brand-twilight border border-slate-800 rounded-xl px-3 py-2.5 md:py-3 text-sm md:text-base text-slate-200 focus:outline-none focus:border-brand-caribbeanSea min-h-[42px] md:min-h-[46px]"
        >
          <option value="in_person">In person</option>
          <option value="livestream">Livestream</option>
          <option value="hybrid">Hybrid</option>
        </select>
        <select
          name="cityId"
          className="bg-brand-twilight border border-slate-800 rounded-xl px-3 py-2.5 md:py-3 text-sm md:text-base text-slate-200 focus:outline-none focus:border-brand-caribbeanSea min-h-[42px] md:min-h-[46px]"
        >
          <option value="">Select a city…</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name} ({city.country_iso})
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          name="startsAt"
          type="datetime-local"
          required
          className="bg-brand-twilight border border-slate-800 rounded-xl px-3 py-2.5 md:py-3 text-sm md:text-base text-slate-200 focus:outline-none focus:border-brand-caribbeanSea min-h-[42px] md:min-h-[46px]"
        />
        <input
          name="capacity"
          type="number"
          min="1"
          placeholder="Capacity (optional)"
          className="bg-brand-twilight border border-slate-800 rounded-xl px-3 py-2.5 md:py-3 text-sm md:text-base text-brand-sandstone placeholder-brand-sandstone/40 focus:outline-none focus:border-brand-caribbeanSea min-h-[42px] md:min-h-[46px]"
        />
      </div>
      <input
        name="venue"
        placeholder="Venue (optional)"
        className="w-full bg-brand-twilight border border-slate-800 rounded-xl px-4 py-2.5 md:py-3 text-sm md:text-base text-brand-sandstone placeholder-brand-sandstone/40 focus:outline-none focus:border-brand-caribbeanSea transition-colors min-h-[42px] md:min-h-[46px]"
      />
      {state.error && (
        <p role="alert" className="text-xs md:text-sm text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3.5 py-2.5">{state.error}</p>
      )}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-semibold text-brand-sandstone/60 hover:text-brand-sandstone transition-colors min-h-[38px] md:min-h-[42px]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="bg-brand-caribbeanSea hover:brightness-110 disabled:opacity-60 text-slate-950 font-bold px-5 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm transition-all min-h-[38px] md:min-h-[42px]"
        >
          {pending ? 'Publishing…' : 'Publish Event'}
        </button>
      </div>
    </form>
  );
}
