import { Player, HoleSetup, Match, MatchResult } from '../types';
import { getNetScore } from './scoring';
import { computePerformances, findMVP, formatDifferential } from './performance';

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

  // ---- Performance analysis ----
  const performances = computePerformances(players, holes, scores);
  const mvp = findMVP(performances);
  const perfById = new Map(performances.map((pp) => [pp.playerId, pp]));

  // ---- MVP ----
  if (mvp && mvp.holesPlayed > 0) {
    L.push('ROUND MVP');
    L.push('-'.repeat(30));
    const extras: string[] = [];
    if (mvp.eagles > 0) extras.push(`${mvp.eagles} eagle${mvp.eagles === 1 ? '' : 's'}`);
    if (mvp.birdies > 0) extras.push(`${mvp.birdies} birdie${mvp.birdies === 1 ? '' : 's'}`);
    const extrasStr = extras.length ? ` / ${extras.join(', ')}` : '';
    L.push(
      `${mvp.name}  (Grade ${mvp.grade})  ${mvp.holesWon} won / ${mvp.holesTied} tied${extrasStr} / ${formatDifferential(
        mvp.differential
      )} vs hcp`
    );
    L.push('');
  }

  // ---- Holes won / tied ----
  const holesWonRanks = players
    .map((p) => {
      const perf = perfById.get(p.id)!;
      return { name: p.name, won: perf.holesWon, tied: perf.holesTied };
    })
    .sort((a, b) => b.won - a.won || b.tied - a.tied);
  L.push('HOLES WON (Low Gross)');
  L.push('-'.repeat(30));
  L.push(`${padRight('', nameWidth + 3)}${padLeft('Won', 5)} ${padLeft('Tied', 5)}`);
  holesWonRanks.forEach((r, i) => {
    L.push(
      `${i + 1}. ${padRight(r.name, nameWidth)}${padLeft(r.won, 5)} ${padLeft(r.tied, 5)}`
    );
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

  // ---- Performance Grades ----
  const gradeRanks = [...performances].sort((a, b) => b.differential - a.differential);
  L.push('PERFORMANCE GRADES (Score vs Handicap)');
  L.push('-'.repeat(30));
  L.push(
    `${padRight('', 3)}${padRight('Player', nameWidth)} ${padLeft('Grd', 4)} ${padLeft(
      'Hcp',
      4
    )} ${padLeft('+/-', 5)} ${padLeft('Eag', 4)} ${padLeft('Bir', 4)} ${padLeft('vs Hcp', 7)}`
  );
  gradeRanks.forEach((perf, i) => {
    const player = players.find((p) => p.id === perf.playerId)!;
    const scoreStr =
      perf.holesPlayed === 0
        ? '-'
        : perf.scoreToPar === 0
        ? 'E'
        : perf.scoreToPar > 0
        ? `+${perf.scoreToPar}`
        : String(perf.scoreToPar);
    L.push(
      `${i + 1}. ${padRight(perf.name, nameWidth)} ${padLeft(perf.grade, 4)} ${padLeft(
        player.handicap,
        4
      )} ${padLeft(scoreStr, 5)} ${padLeft(perf.eagles, 4)} ${padLeft(perf.birdies, 4)} ${padLeft(
        formatDifferential(perf.differential),
        7
      )}`
    );
  });
  L.push('Grade combines score vs handicap, holes won/tied, and natural birdies/eagles.');
  L.push('A>=+4, B>=+2, C within +/-1, D -2 to -4, F <=-5.');
  L.push('');

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

// ---- PDF generation ----

export async function generatePDFBlob(element: HTMLElement): Promise<Blob> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ]);

  const scale = 2;
  const canvas = await html2canvas(element, {
    scale,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  });

  // Collect section break points (in canvas pixels, relative to top of element)
  const elementRect = element.getBoundingClientRect();
  const elementTop = elementRect.top;
  const sectionBreaks: number[] = [];
  element.querySelectorAll('[data-pdf-section]').forEach((sec) => {
    const r = (sec as HTMLElement).getBoundingClientRect();
    sectionBreaks.push((r.top - elementTop) * scale);
  });
  // Ensure first and last positions are included
  sectionBreaks.push(0);
  sectionBreaks.push(canvas.height);
  sectionBreaks.sort((a, b) => a - b);
  // Dedupe
  const uniqueBreaks = sectionBreaks.filter(
    (v, i, arr) => i === 0 || Math.abs(v - arr[i - 1]) > 1
  );

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const marginSide = 8; // mm
  const marginTopBottom = 10; // mm
  const contentWidthMm = pdfWidth - 2 * marginSide;
  const contentHeightMm = pdfHeight - 2 * marginTopBottom;

  // Convert canvas px → mm
  const mmPerPx = contentWidthMm / canvas.width;
  const pageContentHeightPx = contentHeightMm / mmPerPx;
  // Minimum content per page to avoid awkward near-empty pages; used when
  // deciding whether to break earlier than necessary at a section boundary.
  const minContentPx = pageContentHeightPx * 0.3;

  let currentY = 0;
  let pageIndex = 0;

  while (currentY < canvas.height) {
    const maxPageEnd = currentY + pageContentHeightPx;
    let pageEnd = Math.min(maxPageEnd, canvas.height);

    // If there is content beyond this page, try to break at a section boundary
    if (pageEnd < canvas.height) {
      // Find the latest section break that falls within [currentY + minContent, maxPageEnd]
      let bestBreak = -1;
      for (const bp of uniqueBreaks) {
        if (bp > currentY + minContentPx && bp <= maxPageEnd) {
          bestBreak = bp;
        }
      }
      if (bestBreak > 0) {
        pageEnd = bestBreak;
      }
    }

    const slicePx = pageEnd - currentY;

    // Render the slice to a temporary canvas
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = Math.ceil(slicePx);
    const ctx = sliceCanvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2d context');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    ctx.drawImage(canvas, 0, -currentY);
    const dataUrl = sliceCanvas.toDataURL('image/jpeg', 0.92);

    const sliceHeightMm = slicePx * mmPerPx;

    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(dataUrl, 'JPEG', marginSide, marginTopBottom, contentWidthMm, sliceHeightMm);

    currentY = pageEnd;
    pageIndex += 1;
  }

  return pdf.output('blob');
}

export async function sharePDF(
  blob: Blob,
  filename: string,
  title: string
): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], filename, { type: 'application/pdf' });

  // Try native share with file
  if (
    typeof navigator !== 'undefined' &&
    'share' in navigator &&
    'canShare' in navigator &&
    (navigator as any).canShare({ files: [file] })
  ) {
    try {
      await (navigator as any).share({ files: [file], title });
      return 'shared';
    } catch {
      // user cancelled — fall through to download
    }
  }

  // Fallback: download the file
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}
