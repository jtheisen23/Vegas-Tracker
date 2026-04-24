/**
 * Calculate the Vegas score for a single hole between two teams.
 *
 * Rules:
 * - Each team's two net scores form a two-digit number (lower digit first → e.g. 4,5 = 45)
 * - A NATURAL (gross) birdie normally flips the OPPONENT's number
 *   (higher digit first → e.g. 5,4 = 54).
 * - The opponent's NET birdie shields them — the gross-birdie flip is cancelled.
 * - A NET EAGLE is stronger than a gross birdie: it flips the opponent and
 *   cannot be shielded by a net birdie.
 * - Points = opponent's number - your number (positive = you win)
 */
export function calculateVegasPoints(
  team1Scores: [number, number],
  team2Scores: [number, number],
  par: number,
  team1Gross: [number, number],
  team2Gross: [number, number]
): { team1Vegas: number; team2Vegas: number; points: number } {
  const team1HasGrossBirdie = team1Gross[0] <= par - 1 || team1Gross[1] <= par - 1;
  const team2HasGrossBirdie = team2Gross[0] <= par - 1 || team2Gross[1] <= par - 1;
  const team1HasNetBirdie = team1Scores[0] <= par - 1 || team1Scores[1] <= par - 1;
  const team2HasNetBirdie = team2Scores[0] <= par - 1 || team2Scores[1] <= par - 1;
  const team1HasNetEagle = team1Scores[0] <= par - 2 || team1Scores[1] <= par - 2;
  const team2HasNetEagle = team2Scores[0] <= par - 2 || team2Scores[1] <= par - 2;

  const sorted1 = [...team1Scores].sort((a, b) => a - b) as [number, number];
  const sorted2 = [...team2Scores].sort((a, b) => a - b) as [number, number];

  // Net eagle always flips the opponent (trumps any net-birdie shield).
  // Gross birdie flips unless the opponent has at least a net birdie.
  const flipTeam1 = team2HasNetEagle || (team2HasGrossBirdie && !team1HasNetBirdie);
  const flipTeam2 = team1HasNetEagle || (team1HasGrossBirdie && !team2HasNetBirdie);

  const team1Vegas = flipTeam1
    ? sorted1[1] * 10 + sorted1[0]
    : sorted1[0] * 10 + sorted1[1];
  const team2Vegas = flipTeam2
    ? sorted2[1] * 10 + sorted2[0]
    : sorted2[0] * 10 + sorted2[1];

  const points = team2Vegas - team1Vegas;

  return { team1Vegas, team2Vegas, points };
}

/**
 * Get the net score for a player on a specific hole.
 */
export function getNetScore(
  grossScore: number,
  playerStrokesReceived: number,
  holeHandicapRating: number,
  totalHoles: number = 18
): number {
  // Player gets a stroke on this hole if their strokes received >= hole handicap rating
  // For strokes > 18, they get 2 strokes on the easiest holes
  let strokes = 0;
  if (playerStrokesReceived >= holeHandicapRating) {
    strokes = 1;
  }
  if (playerStrokesReceived >= totalHoles + holeHandicapRating) {
    strokes = 2;
  }
  return grossScore - strokes;
}
