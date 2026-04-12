import { Player, HandicapMode } from '../types';

/**
 * Calculate strokes received for each player.
 * 'off-the-low': strokes = handicap - lowest handicap in group
 * 'full': strokes = full handicap value
 */
export function calculateStrokesReceived(players: Player[], mode: HandicapMode = 'off-the-low'): Player[] {
  if (mode === 'full') {
    return players.map((p) => ({
      ...p,
      strokesReceived: p.handicap,
    }));
  }
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
