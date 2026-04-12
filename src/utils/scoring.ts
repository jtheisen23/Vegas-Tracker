/**
 * Calculate the Vegas score for a single hole between two teams.
 *
 * Rules:
 * - Each team's two net scores form a two-digit number (lower digit first → e.g. 4,5 = 45)
 * - If a team has a NATURAL birdie (gross score <= par-1), the OPPONENT's number is flipped
 *   (higher digit first → e.g. 5,4 = 54)
 * - Points = opponent's number - your number (positive = you win)
 */
export function calculateVegasPoints(
  team1Scores: [number, number],
  team2Scores: [number, number],
  par: number,
  team1Gross: [number, number],
  team2Gross: [number, number]
): { team1Vegas: number; team2Vegas: number; points: number } {
  // Only natural (gross) birdies flip the opponent's score
  const team1HasBirdie = team1Gross[0] <= par - 1 || team1Gross[1] <= par - 1;
  const team2HasBirdie = team2Gross[0] <= par - 1 || team2Gross[1] <= par - 1;

  const sorted1 = [...team1Scores].sort((a, b) => a - b) as [number, number];
  const sorted2 = [...team2Scores].sort((a, b) => a - b) as [number, number];

  // Normal: lower digit first. Flipped: higher digit first.
  let team1Vegas: number;
  let team2Vegas: number;

  if (team2HasBirdie) {
    // Opponent (team2) has birdie → flip team1's number
    team1Vegas = sorted1[1] * 10 + sorted1[0];
  } else {
    team1Vegas = sorted1[0] * 10 + sorted1[1];
  }

  if (team1HasBirdie) {
    // Opponent (team1) has birdie → flip team2's number
    team2Vegas = sorted2[1] * 10 + sorted2[0];
  } else {
    team2Vegas = sorted2[0] * 10 + sorted2[1];
  }

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
