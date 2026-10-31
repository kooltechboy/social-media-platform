import { useEffect, useState } from 'react';
import { supabase } from './supabase';

/**
 * Caribbean territory reference data, sourced from the `public.countries`
 * table (public-read RLS, migration 00001 + 00005). This replaces the
 * hand-maintained country arrays that used to be duplicated per screen.
 *
 * Privacy (AGENTS.md Rule 8): this is selection data only. Never use it to
 * infer a user's identity — a user's country is whatever they chose, or nothing.
 */
export interface Territory {
  /** ISO 3166-1 alpha-3 code — matches `*.country_iso` columns. */
  iso: string;
  /** ISO 3166-1 alpha-2 code. */
  iso2: string;
  /** Display name — matches free-text `profiles.country`. */
  name: string;
  flag: string;
}

let cache: Territory[] | null = null;
let inflight: Promise<Territory[]> | null = null;

async function loadTerritories(): Promise<Territory[]> {
  if (cache) return cache;
  if (!inflight) {
    inflight = (async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('iso_code, iso2_code, name, flag_emoji')
        .order('name', { ascending: true });
      if (error) throw error;
      cache = (data || []).map((row: any) => ({
        iso: row.iso_code,
        iso2: row.iso2_code,
        name: row.name,
        flag: row.flag_emoji || '',
      }));
      return cache;
    })().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

export interface TerritoriesState {
  territories: Territory[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

/** Loads (and memoises for the app session) the territory list from Supabase. */
export function useTerritories(): TerritoriesState {
  const [territories, setTerritories] = useState<Territory[]>(cache || []);
  const [loading, setLoading] = useState<boolean>(!cache);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    if (cache) {
      setTerritories(cache);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    loadTerritories()
      .then((rows) => {
        if (active) setTerritories(rows);
      })
      .catch((err: any) => {
        if (active) setError(err?.message || 'Could not load territories.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  return { territories, loading, error, retry: () => setAttempt((n) => n + 1) };
}

/** Lookup helper for rendering a stored `country_iso` value. */
export function findTerritory(territories: Territory[], isoOrName: string | null | undefined): Territory | null {
  if (!isoOrName) return null;
  const key = isoOrName.trim().toUpperCase();
  return (
    territories.find((t) => t.iso === key || t.iso2 === key || t.name.toUpperCase() === key) || null
  );
}
