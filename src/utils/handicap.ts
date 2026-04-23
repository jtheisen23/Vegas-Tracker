import { Player, HandicapMode } from '../types';

/**
 * Course constants for the hardcoded Geneva Golf Club setup.
 * If the default course is ever changed, update these alongside the
 * pars/stroke indexes in hooks/useRound.ts.
 */
export const COURSE_RATING = 70;
export const COURSE_SLOPE = 132;
export const COURSE_PAR = 68;

/**
 * Convert a Handicap Index to a Course Handicap using the standard formula:
 *   CH = round(Index × (Slope / 113) + (Rating − Par))
 */
export function toCourseHandicap(
  index: number,
  slope: number = COURSE_SLOPE,
  rating: number = COURSE_RATING,
  par: number = COURSE_PAR,
): number {
  return Math.round(index * (slope / 113) + (rating - par));
}

/**
 * Calculate strokes received for each player.
 * 'off-the-low': strokes = courseHandicap - lowest courseHandicap in group
 * 'full': strokes = full courseHandicap
 */
export function calculateStrokesReceived(players: Player[], mode: HandicapMode = 'off-the-low'): Player[] {
  const courseHdcps = players.map((p) => toCourseHandicap(p.handicap));
  if (mode === 'full') {
    return players.map((p, i) => ({
      ...p,
      strokesReceived: courseHdcps[i],
    }));
  }
  const minCH = Math.min(...courseHdcps);
  return players.map((p, i) => ({
    ...p,
    strokesReceived: courseHdcps[i] - minCH,
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
