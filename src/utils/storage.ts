import { SavedRound } from '../types';

const STORAGE_KEY = 'vegas-golf-rounds';

export function saveRound(round: SavedRound): void {
  const rounds = loadRounds();
  rounds.unshift(round);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rounds));
}

export function loadRounds(): SavedRound[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function deleteRound(roundId: string): void {
  const rounds = loadRounds().filter((r) => r.id !== roundId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rounds));
}
