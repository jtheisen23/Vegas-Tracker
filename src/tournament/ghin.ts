/**
 * GHIN integration stub.
 *
 * The real GHIN API requires a USGA partnership and credentials. Wire this
 * function to your authorized backend (never expose credentials client-side).
 * The signature matches what the UI expects, so swapping in a real call is
 * a one-file change.
 */

export interface GhinLookupResult {
  ghinNumber: string;
  name: string;
  handicapIndex: number;
  club?: string;
}

export async function fetchGhinIndex(ghinNumber: string): Promise<GhinLookupResult> {
  const trimmed = ghinNumber.trim();
  if (!trimmed) throw new Error('GHIN number required');

  // TODO: replace with a call to your authorized GHIN proxy, e.g.
  //   const res = await fetch(`/api/ghin/lookup?number=${trimmed}`);
  //   if (!res.ok) throw new Error('Lookup failed');
  //   return res.json();

  throw new Error(
    'GHIN lookup not configured. Enter the handicap index manually, or wire fetchGhinIndex to your authorized GHIN proxy.'
  );
}

/**
 * Course handicap = Handicap Index * (Slope / 113) + (Course Rating - Par).
 * We approximate with Index rounded to nearest whole stroke unless slope/rating
 * are supplied. Tournaments usually multiply by an allowance (e.g. 85%) afterward.
 */
export function courseHandicap(
  index: number,
  slope = 113,
  rating?: number,
  par?: number,
): number {
  const base = index * (slope / 113);
  const adjustment = rating != null && par != null ? rating - par : 0;
  return Math.round(base + adjustment);
}

export function applyAllowance(courseHdcp: number, allowancePct: number): number {
  return Math.round(courseHdcp * (allowancePct / 100));
}
