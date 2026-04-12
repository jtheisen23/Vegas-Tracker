import { Player, HoleSetup } from '../types';

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface PlayerPerformance {
  playerId: string;
  name: string;
  holesPlayed: number;
  gross: number;
  parPlayed: number;
  scoreToPar: number;
  expectedOverPar: number; // handicap scaled by holes played
  differential: number; // expectedOverPar - scoreToPar (positive = beat handicap)
  adjustedDifferential: number; // differential + bonuses from holes won/tied
  grade: Grade;
  holesWon: number;
  holesTied: number;
  mvpScore: number;
}

// Bonus applied per sole hole won and per tied hole toward the grade calculation.
const HOLE_WON_BONUS = 0.5;
const HOLE_TIED_BONUS = 0.25;

// Grade bands (applied to the rounded adjusted differential).
// A: beat expectation by 4+
// B: beat by 2 or 3
// C: within 1 shot either way
// D: worse by 2 to 4
// F: worse by 5+
export function getGrade(adjustedDifferential: number): Grade {
  const rounded = Math.round(adjustedDifferential);
  if (rounded >= 4) return 'A';
  if (rounded >= 2) return 'B';
  if (rounded >= -1) return 'C';
  if (rounded >= -4) return 'D';
  return 'F';
}

export function gradeColor(grade: Grade): string {
  switch (grade) {
    case 'A':
      return '#b8860b'; // gold
    case 'B':
      return '#16a34a'; // green
    case 'C':
      return '#2563eb'; // blue
    case 'D':
      return '#d97706'; // orange
    case 'F':
      return '#c1121f'; // red
  }
}

export function computePerformances(
  players: Player[],
  holes: HoleSetup[],
  scores: Record<string, Record<number, number>>
): PlayerPerformance[] {
  // First compute holes won/tied
  const holesWon = new Map<string, number>();
  const holesTied = new Map<string, number>();
  players.forEach((p) => {
    holesWon.set(p.id, 0);
    holesTied.set(p.id, 0);
  });
  holes.forEach((hole) => {
    const entries = players
      .map((p) => ({ id: p.id, score: scores[p.id]?.[hole.number] }))
      .filter((e): e is { id: string; score: number } => e.score != null);
    if (entries.length === 0) return;
    const min = Math.min(...entries.map((e) => e.score));
    const leaders = entries.filter((e) => e.score === min);
    if (leaders.length === 1) {
      holesWon.set(leaders[0].id, (holesWon.get(leaders[0].id) || 0) + 1);
    } else {
      leaders.forEach(({ id }) => holesTied.set(id, (holesTied.get(id) || 0) + 1));
    }
  });

  const totalHoles = holes.length || 18;

  return players.map((p) => {
    let gross = 0;
    let parPlayed = 0;
    let holesPlayed = 0;
    holes.forEach((h) => {
      const g = scores[p.id]?.[h.number];
      if (g != null) {
        gross += g;
        parPlayed += h.par;
        holesPlayed += 1;
      }
    });
    const scoreToPar = gross - parPlayed;
    const expectedOverPar = (p.handicap * holesPlayed) / totalHoles;
    const differential = expectedOverPar - scoreToPar;
    const won = holesWon.get(p.id) || 0;
    const tied = holesTied.get(p.id) || 0;
    const adjustedDifferential = differential + won * HOLE_WON_BONUS + tied * HOLE_TIED_BONUS;
    const grade: Grade = holesPlayed === 0 ? 'F' : getGrade(adjustedDifferential);
    // MVP scoring: sole wins valued highly, ties worth less, performance adds/subtracts
    const mvpScore = won * 3 + tied * 1 + differential * 2;

    return {
      playerId: p.id,
      name: p.name,
      holesPlayed,
      gross,
      parPlayed,
      scoreToPar,
      expectedOverPar,
      differential,
      adjustedDifferential,
      grade,
      holesWon: won,
      holesTied: tied,
      mvpScore,
    };
  });
}

export function findMVP(performances: PlayerPerformance[]): PlayerPerformance | null {
  const withData = performances.filter((p) => p.holesPlayed > 0);
  if (withData.length === 0) return null;
  return [...withData].sort((a, b) => b.mvpScore - a.mvpScore)[0];
}

export function formatDifferential(diff: number): string {
  const rounded = Math.round(diff * 10) / 10;
  if (rounded === 0) return 'E';
  return rounded > 0 ? `+${rounded}` : String(rounded);
}

