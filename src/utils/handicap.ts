import { Player, HandicapMode, HoleSetup, CourseRatings } from '../types';

/**
 * Default course ratings, used when a round hasn't specified its own.
 * These match the original Geneva Golf Club setup (see hooks/useRound.ts
 * for the matching default pars/stroke indexes). They are only fallbacks:
 * rating and slope are editable per round in the Course setup step, and
 * par is derived from the hole pars via coursePar().
 */
export const COURSE_RATING = 70;
export const COURSE_SLOPE = 132;
export const COURSE_PAR = 68;

export const DEFAULT_COURSE: CourseRatings = {
  rating: COURSE_RATING,
  slope: COURSE_SLOPE,
  par: COURSE_PAR,
};

/**
 * Total par for a course, summed from its hole pars.
 */
export function coursePar(holes: HoleSetup[]): number {
  return holes.reduce((sum, h) => sum + h.par, 0);
}

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
export function calculateStrokesReceived(
  players: Player[],
  mode: HandicapMode = 'off-the-low',
  course: CourseRatings = DEFAULT_COURSE,
): Player[] {
  const courseHdcps = players.map((p) =>
    toCourseHandicap(p.handicap, course.slope, course.rating, course.par),
  );
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
