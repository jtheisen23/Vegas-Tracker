import { Player, Match, HoleSetup, Multiplier } from '../types';
import { getNetScore } from '../utils/scoring';
import { getStrokesOnHole } from '../utils/handicap';

interface Props {
  players: Player[];
  holes: HoleSetup[];
  matches: Match[];
  scores: Record<string, Record<number, number>>;
  currentHole: number;
  onSetCurrentHole: (hole: number) => void;
  onSetScore: (playerId: string, holeNumber: number, grossScore: number) => void;
  onClearScore: (playerId: string, holeNumber: number) => void;
  onShowScoreboard: () => void;
  getMatchResultsForHole: (match: Match, holeNumber: number) => { team1Vegas: number; team2Vegas: number; points: number } | null;
  getActiveMatches: () => Match[];
  getCurrentRotation: () => number;
  getMultiplier: (matchId: string, holeNumber: number) => Multiplier;
  getMultiplierValue: (m: Multiplier) => number;
  onSetMultiplier: (matchId: string, holeNumber: number, value: Multiplier) => void;
}

export default function HoleEntry({
  players,
  holes,
  scores,
  currentHole,
  onSetCurrentHole,
  onSetScore,
  onClearScore,
  onShowScoreboard,
  getMatchResultsForHole,
  getActiveMatches,
  getCurrentRotation,
  matches,
  getMultiplier,
  getMultiplierValue,
  onSetMultiplier,
}: Props) {
  const hole = holes.find((h) => h.number === currentHole)!;
  const activeMatches = getActiveMatches();
  const rotation = getCurrentRotation();

  // Get unique players involved in active matches
  const activePlayerIds = new Set<string>();
  activeMatches.forEach((m) => {
    m.team1.forEach((id) => activePlayerIds.add(id));
    m.team2.forEach((id) => activePlayerIds.add(id));
  });

  const handleScoreChange = (playerId: string, value: string) => {
    const num = parseInt(value);
    if (value === '' || isNaN(num)) {
      onClearScore(playerId, currentHole);
    } else if (num >= 1 && num <= 15) {
      onSetScore(playerId, currentHole, num);
    }
  };

  const allScoresEntered = players
    .filter((p) => activePlayerIds.has(p.id))
    .every((p) => scores[p.id]?.[currentHole] != null);

  return (
    <div className="min-h-screen bg-slate-900 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onShowScoreboard}
          className="text-emerald-400 text-sm font-medium"
        >
          Scoreboard
        </button>
        <h1 className="text-xl font-bold text-emerald-400">Hole {currentHole}</h1>
        <div className="text-sm text-slate-400">
          Par {hole.par} | R{rotation}
        </div>
      </div>

      {/* Hole navigation */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <button
          onClick={() => onSetCurrentHole(Math.max(1, currentHole - 1))}
          disabled={currentHole === 1}
          className="bg-slate-700 disabled:bg-slate-800 disabled:text-slate-600 text-white w-10 h-10 rounded-lg font-bold text-lg"
        >
          &lt;
        </button>
        <div className="flex gap-1 overflow-x-auto px-2">
          {holes.map((h) => (
            <button
              key={h.number}
              onClick={() => onSetCurrentHole(h.number)}
              className={`w-8 h-8 rounded-md text-xs font-medium flex-shrink-0 ${
                h.number === currentHole
                  ? 'bg-emerald-600 text-white'
                  : players.every((p) => !activePlayerIds.has(p.id) || scores[p.id]?.[h.number] != null)
                    ? 'bg-slate-600 text-slate-300'
                    : 'bg-slate-800 text-slate-500'
              }`}
            >
              {h.number}
            </button>
          ))}
        </div>
        <button
          onClick={() => onSetCurrentHole(Math.min(18, currentHole + 1))}
          disabled={currentHole === 18}
          className="bg-slate-700 disabled:bg-slate-800 disabled:text-slate-600 text-white w-10 h-10 rounded-lg font-bold text-lg"
        >
          &gt;
        </button>
      </div>

      {/* Score entry */}
      <div className="space-y-3 mb-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Enter Gross Scores</h2>
        {players
          .filter((p) => activePlayerIds.has(p.id))
          .map((player) => {
            const strokes = getStrokesOnHole(player.strokesReceived, hole.handicapRating);
            const gross = scores[player.id]?.[currentHole];
            const net = gross != null ? getNetScore(gross, player.strokesReceived, hole.handicapRating) : null;

            return (
              <div key={player.id} className="bg-slate-800 rounded-xl p-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-white font-medium text-sm">{player.name}</div>
                  <div className="text-xs text-slate-500">
                    {strokes > 0 ? (
                      <span className="text-yellow-400">{strokes} stroke{strokes > 1 ? 's' : ''}</span>
                    ) : (
                      'No strokes'
                    )}
                    {net != null && (
                      <span className="ml-2 text-slate-400">Net: {net}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const current = scores[player.id]?.[currentHole] || hole.par;
                      if (current > 1) handleScoreChange(player.id, String(current - 1));
                    }}
                    className="bg-slate-700 text-white w-9 h-9 rounded-lg text-lg font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={scores[player.id]?.[currentHole] ?? ''}
                    onChange={(e) => handleScoreChange(player.id, e.target.value)}
                    placeholder={String(hole.par)}
                    className="w-14 h-9 bg-slate-700 text-white text-center rounded-lg text-lg font-bold border border-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      const current = scores[player.id]?.[currentHole] || hole.par;
                      if (current < 15) handleScoreChange(player.id, String(current + 1));
                    }}
                    className="bg-slate-700 text-white w-9 h-9 rounded-lg text-lg font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* Match results for this hole */}
      {allScoresEntered && (
        <div className="space-y-3 mb-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">This Hole</h2>
          {activeMatches.map((match) => {
            const result = getMatchResultsForHole(match, currentHole);
            if (!result) return null;
            const t1 = match.team1.map((id) => players.find((p) => p.id === id)?.name || '?');
            const t2 = match.team2.map((id) => players.find((p) => p.id === id)?.name || '?');
            const winner = result.points > 0 ? 'team1' : result.points < 0 ? 'team2' : 'tie';
            const currentMult = getMultiplier(match.id, currentHole);
            const multValue = getMultiplierValue(currentMult);
            const multipliedPoints = result.points * multValue;

            // Determine next escalation step
            const nextStep: { label: string; value: Multiplier } | null =
              currentMult === 'none' ? { label: 'Press (x2)', value: 'press' } :
              currentMult === 'press' ? { label: 'Roll (x4)', value: 'roll' } :
              currentMult === 'roll' ? { label: 'Re-Roll (x8)', value: 're-roll' } :
              null;

            return (
              <div key={match.id} className="bg-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${winner === 'team1' ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {t1.join(' & ')}
                  </span>
                  <span className="text-lg font-bold text-white">{result.team1Vegas}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${winner === 'team2' ? 'text-orange-400' : 'text-slate-400'}`}>
                    {t2.join(' & ')}
                  </span>
                  <span className="text-lg font-bold text-white">{result.team2Vegas}</span>
                </div>
                <div className="text-center mt-2 pt-2 border-t border-slate-700">
                  {winner === 'tie' ? (
                    <span className="text-slate-400 text-sm">Push</span>
                  ) : (
                    <span className={`font-bold ${winner === 'team1' ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {winner === 'team1' ? t1.join(' & ') : t2.join(' & ')} win {Math.abs(multipliedPoints)} pts
                      {currentMult !== 'none' && (
                        <span className="text-yellow-400 ml-1 text-xs uppercase">({currentMult} x{multValue})</span>
                      )}
                    </span>
                  )}
                </div>

                {/* Press / Roll / Re-Roll buttons */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700">
                  {currentMult !== 'none' && (
                    <button
                      onClick={() => onSetMultiplier(match.id, currentHole, 'none')}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold bg-slate-700 text-slate-400"
                    >
                      Clear
                    </button>
                  )}
                  {nextStep && (
                    <button
                      onClick={() => onSetMultiplier(match.id, currentHole, nextStep.value)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold bg-yellow-600 text-white"
                    >
                      {nextStep.label}
                    </button>
                  )}
                  {currentMult === 're-roll' && (
                    <span className="flex-1 py-2 rounded-lg text-xs font-bold bg-red-900 text-red-300 text-center">
                      Max (x8)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Running totals for active matches */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Running Totals (Rotation {rotation})</h2>
        {activeMatches.map((match) => {
          let total = 0;
          const startHole = (match.rotation - 1) * 6 + 1;
          for (let h = startHole; h <= currentHole; h++) {
            const r = getMatchResultsForHole(match, h);
            if (r) total += r.points * getMultiplierValue(getMultiplier(match.id, h));
          }
          const t1 = match.team1.map((id) => players.find((p) => p.id === id)?.name || '?');
          const t2 = match.team2.map((id) => players.find((p) => p.id === id)?.name || '?');

          return (
            <div key={match.id} className="bg-slate-800 rounded-lg p-3 flex items-center justify-between">
              <div className="text-sm">
                <span className="text-emerald-300">{t1.join(' & ')}</span>
                <span className="text-slate-500 mx-1">vs</span>
                <span className="text-orange-300">{t2.join(' & ')}</span>
              </div>
              <span className={`font-bold text-lg ${total > 0 ? 'text-emerald-400' : total < 0 ? 'text-orange-400' : 'text-slate-400'}`}>
                {total > 0 ? '+' : ''}{total}
              </span>
            </div>
          );
        })}
      </div>

      {/* Next hole button */}
      {allScoresEntered && currentHole < 18 && (
        <button
          onClick={() => onSetCurrentHole(currentHole + 1)}
          className="w-full mt-6 bg-emerald-600 text-white py-3 rounded-xl font-semibold text-lg"
        >
          Next Hole &gt;
        </button>
      )}
    </div>
  );
}
