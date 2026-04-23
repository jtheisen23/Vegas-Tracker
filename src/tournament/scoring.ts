import type { LeaderboardEntry, TourHole, Tournament } from './types';
import { getStrokesOnHole } from '../utils/handicap';

export function netScore(gross: number, strokesOnHole: number): number {
  return gross - strokesOnHole;
}

/**
 * Standard Stableford points (net):
 *   Double bogey or worse = 0, bogey = 1, par = 2, birdie = 3, eagle = 4, albatross = 5.
 */
export function stablefordPoints(net: number, par: number): number {
  const diff = net - par;
  if (diff >= 0) return Math.max(0, 2 - diff);
  return 2 + Math.abs(diff); // -1 => 3, -2 => 4, -3 => 5
}

export function buildLeaderboard(t: Tournament): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];

  const playerGroup = new Map<string, string>();
  t.groups.forEach((g) => g.playerIds.forEach((pid) => playerGroup.set(pid, g.name)));

  Object.values(t.players).forEach((player) => {
    const groupId = t.groups.find((g) => g.playerIds.includes(player.id))?.id;
    if (!groupId) return;

    const holeScores = t.scores[groupId]?.[player.id] || {};
    let gross = 0;
    let net = 0;
    let stableford = 0;
    let parPlayed = 0;
    let thru = 0;

    t.holes.forEach((hole) => {
      const g = holeScores[hole.number];
      if (g == null) return;
      thru += 1;
      parPlayed += hole.par;
      gross += g;
      const strokes = getStrokesOnHole(player.courseHandicap, hole.handicapRating);
      const n = netScore(g, strokes);
      net += n;
      stableford += stablefordPoints(n, hole.par);
    });

    entries.push({
      playerId: player.id,
      playerName: player.name,
      groupName: playerGroup.get(player.id) || '',
      thru,
      grossTotal: gross,
      grossToPar: gross - parPlayed,
      netTotal: net,
      netToPar: net - parPlayed,
      stableford,
      position: 0,
    });
  });

  const sorted = [...entries].sort((a, b) => {
    if (a.thru === 0 && b.thru === 0) return 0;
    if (a.thru === 0) return 1;
    if (b.thru === 0) return -1;
    if (t.format === 'stableford') return b.stableford - a.stableford;
    return a.netToPar - b.netToPar;
  });

  let lastKey: number | null = null;
  let lastPos = 0;
  sorted.forEach((entry, i) => {
    const key = t.format === 'stableford' ? -entry.stableford : entry.netToPar;
    if (entry.thru === 0) {
      entry.position = 0;
    } else if (lastKey === null || key !== lastKey) {
      entry.position = i + 1;
      lastKey = key;
      lastPos = entry.position;
    } else {
      entry.position = lastPos;
    }
  });

  return sorted;
}

export function formatToPar(n: number): string {
  if (n === 0) return 'E';
  return n > 0 ? `+${n}` : `${n}`;
}

export function holeParsTotal(holes: TourHole[]): number {
  return holes.reduce((sum, h) => sum + h.par, 0);
}
