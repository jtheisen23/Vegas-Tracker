import type { PlayDay } from './types';

const DAY_NUMBERS: Record<PlayDay, number> = {
  sunday: 0,
  friday: 5,
};

export const PLAY_DAY_LABELS: Record<PlayDay, string> = {
  friday: 'Friday',
  sunday: 'Sunday',
};

export const PLAY_DAYS: PlayDay[] = ['friday', 'sunday'];

/**
 * Return the YYYY-MM-DD of the next occurrence of the given weekday,
 * including today if today matches.
 */
export function nextDateForDay(day: PlayDay, from: Date = new Date()): string {
  const target = DAY_NUMBERS[day];
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const diff = (target - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return toIsoDate(d);
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatPlayDate(iso: string): string {
  try {
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function isFuture(iso: string): boolean {
  const today = toIsoDate(new Date());
  return iso >= today;
}
