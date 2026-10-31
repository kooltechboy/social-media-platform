/**
 * Shared, side-effect-free display formatters for the TUKUBI mobile app.
 *
 * These helpers only format values that came from the database. They never
 * invent values: when data is missing they return `null` (or an empty string)
 * so screens can omit the field instead of showing a fabricated placeholder.
 */

/** Supabase embedded relations may come back as an object or a one-element array. */
export function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/** Relative time ("now", "5m", "3h", "2d") falling back to a short date after a week. */
export function timeAgo(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return '';
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return '';
  const seconds = Math.max(0, Math.floor((now - ts) / 1000));
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Compact counts: 950 → "950", 1200 → "1.2K", 3400000 → "3.4M". */
export function formatCompactNumber(value: number | null | undefined): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const abs = Math.abs(n);
  const trim = (x: number) => x.toFixed(1).replace(/\.0$/, '');
  if (abs >= 1_000_000_000) return `${trim(n / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${trim(n / 1_000_000)}M`;
  if (abs >= 1_000) return `${trim(n / 1_000)}K`;
  return String(Math.round(n));
}

/** Format an integer minor-unit amount (cents) in its ISO-4217 currency. */
export function formatMinorCurrency(minor: number | null | undefined, currency: string | null | undefined): string {
  const amount = (typeof minor === 'number' && Number.isFinite(minor) ? minor : 0) / 100;
  const code = (currency || 'USD').toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}

/** Seconds → "m:ss" or "h:mm:ss". */
export function formatDuration(totalSeconds: number | null | undefined): string {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (x: number) => String(x).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/** Up to two initials from a real display name / username; empty when unknown. */
export function initialsOf(name: string | null | undefined): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
}

export interface ProfileLike {
  display_name?: string | null;
  username?: string | null;
}

/** Real display label for a profile, or null when the profile row is unavailable. */
export function profileLabel(p: ProfileLike | null | undefined): string | null {
  return p?.display_name?.trim() || p?.username?.trim() || null;
}

/** "@handle" for a profile, or null when no username exists. */
export function profileHandle(p: ProfileLike | null | undefined): string | null {
  const u = p?.username?.trim();
  return u ? `@${u}` : null;
}
