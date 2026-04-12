import { Player, HoleSetup, Match, MatchResult } from '../types';
import { getNetScore } from './scoring';

export interface RoundExportData {
  courseName: string;
  date: string;
  players: Player[];
  holes: HoleSetup[];
  matches: Match[];
  scores: Record<string, Record<number, number>>;
  results: MatchResult[];
  pointValue: number;
}

function padRight(s: string | number, len: number): string {
  const str = String(s);
  return str.length >= len ? str.slice(0, len) : str + ' '.repeat(len - str.length);
}

function padLeft(s: string | number, len: number): string {
  const str = String(s);
  return str.length >= len ? str.slice(-len) : ' '.repeat(len - str.length) + str;
}

export function formatRoundSummary(data: RoundExportData): string {
  const { courseName, date, players, holes, matches, scores, results, pointValue } = data;

  const L: string[] = [];
  L.push('VEGAS GOLF - ROUND SUMMARY');
  L.push('='.repeat(30));
  if (courseName) L.push(`Course: ${courseName}`);
  L.push(`Date:   ${new Date(date).toLocaleDateString()}`);
  L.push(`Players: ${players.map((p) => p.name).join(', ')}`);
  L.push('');

  // ---- Money leaderboard ----
  const playerMoney = new Map<string, number>();
  players.forEach((p) => playerMoney.set(p.id, 0));
  matches.forEach((m) => {
    const r = results.find((res) => res.matchId === m.id);
    if (!r) return;
    m.team1.forEach((id) => playerMoney.set(id, (playerMoney.get(id) || 0) + r.money));
    m.team2.forEach((id) => playerMoney.set(id, (playerMoney.get(id) || 0) - r.money));
  });
  const moneyRanks = players
    .map((p) => ({ name: p.name, money: playerMoney.get(p.id) || 0 }))
    .sort((a, b) => b.money - a.money);
  L.push('MONEY LEADERBOARD');
  L.push('-'.repeat(30));
  const nameWidth = Math.max(6, ...players.map((p) => p.name.length));
  moneyRanks.forEach((r, i) => {
    const sign = r.money >= 0 ? '+' : '-';
    L.push(`${i + 1}. ${padRight(r.name, nameWidth)}  ${sign}$${Math.abs(r.money).toFixed(2)}`);
  });
  L.push('');

  // ---- Holes won ----
  const holesWon = new Map<string, number>();
  players.forEach((p) => holesWon.set(p.id, 0));
  holes.forEach((hole) => {
    const entries = players
      .map((p) => ({ id: p.id, score: scores[p.id]?.[hole.number] }))
      .filter((e): e is { id: string; score: number } => e.score != null);
    if (entries.length === 0) return;
    const min = Math.min(...entries.map((e) => e.score));
    entries.forEach(({ id, score }) => {
      if (score === min) holesWon.set(id, (holesWon.get(id) || 0) + 1);
    });
  });
  const holesWonRanks = players
    .map((p) => ({ name: p.name, count: holesWon.get(p.id) || 0 }))
    .sort((a, b) => b.count - a.count);
  L.push('HOLES WON (Low Gross, ties count for all)');
  L.push('-'.repeat(30));
  holesWonRanks.forEach((r, i) => {
    L.push(`${i + 1}. ${padRight(r.name, nameWidth)}  ${r.count}`);
  });
  L.push('');

  // ---- Partnerships ----
  const partnerMap = new Map<string, { ids: [string, string]; points: number }>();
  matches.forEach((m) => {
    const r = results.find((res) => res.matchId === m.id);
    if (!r) return;
    const pairs: { pair: [string, string]; points: number }[] = [
      { pair: m.team1, points: r.totalPoints },
      { pair: m.team2, points: -r.totalPoints },
    ];
    pairs.forEach(({ pair, points }) => {
      const key = [...pair].sort().join('|');
      const ex = partnerMap.get(key);
      if (ex) ex.points += points;
      else partnerMap.set(key, { ids: pair, points });
    });
  });
  const pLookup = (id: string) => players.find((p) => p.id === id)?.name || '?';
  const partnerRanks = Array.from(partnerMap.values()).sort((a, b) => b.points - a.points);
  if (partnerRanks.length > 0) {
    L.push('BEST PARTNERSHIPS');
    L.push('-'.repeat(30));
    partnerRanks.forEach((pr, i) => {
      const names = `${pLookup(pr.ids[0])} & ${pLookup(pr.ids[1])}`;
      const sign = pr.points >= 0 ? '+' : '';
      L.push(`${i + 1}. ${padRight(names, nameWidth * 2 + 3)}  ${sign}${pr.points} pts`);
    });
    L.push('');
  }

  // ---- Scorecard ----
  const frontNine = holes.filter((h) => h.number <= 9);
  const backNine = holes.filter((h) => h.number > 9);
  const writeNine = (label: string, nine: HoleSetup[], sumLabel: string) => {
    L.push(`${label}`);
    L.push('-'.repeat(30));
    const headerNums = nine.map((h) => padLeft(h.number, 3)).join('');
    L.push(`${padRight('Hole', nameWidth)}${headerNums} ${padLeft(sumLabel, 4)}`);
    const parRow = nine.map((h) => padLeft(h.par, 3)).join('');
    const parSum = nine.reduce((s, h) => s + h.par, 0);
    L.push(`${padRight('Par', nameWidth)}${parRow} ${padLeft(parSum, 4)}`);
    players.forEach((p) => {
      const cells = nine
        .map((h) => {
          const g = scores[p.id]?.[h.number];
          return padLeft(g != null ? String(g) : '-', 3);
        })
        .join('');
      const total = nine.reduce((s, h) => s + (scores[p.id]?.[h.number] || 0), 0);
      L.push(`${padRight(p.name, nameWidth)}${cells} ${padLeft(total || '-', 4)}`);
    });
    L.push('');
  };
  L.push('SCORECARD (Gross)');
  writeNine('Front 9', frontNine, 'OUT');
  writeNine('Back 9', backNine, 'IN');

  // Totals
  L.push('TOTALS');
  L.push('-'.repeat(30));
  L.push(`${padRight('Player', nameWidth)} ${padLeft('Gross', 6)} ${padLeft('Net', 5)} ${padLeft('+/-', 5)}`);
  players.forEach((p) => {
    let gross = 0;
    let net = 0;
    let parPlayed = 0;
    holes.forEach((h) => {
      const g = scores[p.id]?.[h.number];
      if (g != null) {
        gross += g;
        net += getNetScore(g, p.strokesReceived, h.handicapRating);
        parPlayed += h.par;
      }
    });
    const diff = gross - parPlayed;
    const diffStr = parPlayed === 0 ? '-' : diff === 0 ? 'E' : diff > 0 ? `+${diff}` : String(diff);
    L.push(`${padRight(p.name, nameWidth)} ${padLeft(gross || '-', 6)} ${padLeft(net || '-', 5)} ${padLeft(diffStr, 5)}`);
  });
  L.push('');

  // ---- Match results ----
  L.push('MATCH RESULTS');
  L.push('-'.repeat(30));
  [1, 2, 3].forEach((rotation) => {
    const rotationMatches = matches.filter((m) => m.rotation === rotation);
    if (rotationMatches.length === 0) return;
    const start = (rotation - 1) * 6 + 1;
    const end = rotation * 6;
    L.push(`Rotation ${rotation} (Holes ${start}-${end}):`);
    rotationMatches.forEach((m) => {
      const r = results.find((res) => res.matchId === m.id);
      if (!r) return;
      const sign = r.totalPoints >= 0 ? '+' : '';
      const winner =
        r.totalPoints > 0 ? r.team1Names : r.totalPoints < 0 ? r.team2Names : 'Push';
      const moneyStr =
        r.totalPoints === 0
          ? ''
          : `  $${Math.abs(r.money).toFixed(2)} to ${winner}`;
      L.push(`  ${r.team1Names} vs ${r.team2Names}: ${sign}${r.totalPoints} pts${moneyStr}`);
    });
  });
  L.push('');
  L.push(`Point value: $${pointValue.toFixed(2)} per point`);

  return L.join('\n');
}

export async function shareSummary(summary: string, subject: string): Promise<'shared' | 'copied' | 'failed'> {
  // Try Web Share API first
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      await (navigator as any).share({ title: subject, text: summary });
      return 'shared';
    } catch (err) {
      // user cancelled or failed - fall through to clipboard
    }
  }
  // Fallback: copy to clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(summary);
      return 'copied';
    } catch {
      return 'failed';
    }
  }
  return 'failed';
}

export function emailSummary(summary: string, subject: string): void {
  const body = encodeURIComponent(summary);
  const subj = encodeURIComponent(subject);
  window.location.href = `mailto:?subject=${subj}&body=${body}`;
}

export function textSummary(summary: string): void {
  const body = encodeURIComponent(summary);
  // iOS uses sms:&body=, Android accepts sms:?body=. Using ?body= works on both modern systems.
  window.location.href = `sms:?body=${body}`;
}

export async function copySummary(summary: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(summary);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
