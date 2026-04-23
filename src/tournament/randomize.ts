import type { TourGroup, TourPlayer } from './types';
import { generateId } from './useTournament';

/**
 * Randomize a list of players into groups of `size` (default 4).
 * If the count doesn't divide evenly the final group absorbs the remainder,
 * so we never create a group of 1 or 2 (4, 4, 5 is preferred over 4, 4, 4, 1).
 */
export function randomizeGroups(
  players: TourPlayer[],
  size = 4,
  namePrefix = 'Group',
): TourGroup[] {
  const shuffled = [...players];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  if (shuffled.length === 0) return [];

  const groupCount = Math.max(1, Math.floor(shuffled.length / size));
  const groups: TourGroup[] = Array.from({ length: groupCount }, (_, i) => ({
    id: generateId(),
    name: `${namePrefix} ${i + 1}`,
    playerIds: [],
  }));

  // Fill each group with up to `size` players first, then distribute any
  // remainder round-robin so the overflow groups end up at 5 rather than 1/2.
  shuffled.forEach((p, i) => {
    const gIdx = i < groupCount * size ? Math.floor(i / size) : (i - groupCount * size) % groupCount;
    groups[gIdx].playerIds.push(p.id);
  });

  return groups;
}
