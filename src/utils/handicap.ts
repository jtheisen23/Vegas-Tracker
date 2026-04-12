import { Player } from '../types';

/**
 * Calculate strokes received for each player off the lowest handicap.
 * Returns a new array of players with strokesReceived set.
 */
export function calculateStrokesReceived(players: Player[]): Player[] {
  const minHandicap = Math.min(...players.map((p) => p.handicap));
  return players.map((p) => ({
    ...p,
    strokesReceived: p.handicap - minHandicap,
  }));
}

/**
 * Check if a player gets a stroke on a specific hole.
 */
export function playerGetsStroke(
  strokesReceived: number,
  holeHandicapRating: number,
  totalHoles: number = 18
): boolean {
  if (strokesReceived >= totalHoles + holeHandicapRating) return true; // 2 strokes
  if (strokesReceived >= holeHandicapRating) return true;
  return false;
}

/**
 * Get the number of strokes a player receives on a specific hole.
 */
export function getStrokesOnHole(
  strokesReceived: number,
  holeHandicapRating: number,
  totalHoles: number = 18
): number {
  if (strokesReceived >= totalHoles + holeHandicapRating) return 2;
  if (strokesReceived >= holeHandicapRating) return 1;
  return 0;
}
