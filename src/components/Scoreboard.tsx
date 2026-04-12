import { Player, Match, Multiplier } from '../types';

interface Props {
  players: Player[];
  matches: Match[];
  pointValue: number;
  getMatchTotal: (match: Match) => number;
  getPlayerMoney: (playerId: string) => number;
  onBack: () => void;
  onFinish: () => void;
  getMatchResultsForHole: (match: Match, holeNumber: number) => { team1Vegas: number; team2Vegas: number; points: number } | null;
  getMultiplier: (matchId: string, holeNumber: number) => Multiplier;
  getMultiplierValue: (m: Multiplier) => number;
}

export default function Scoreboard({
  players,
  matches,
  pointValue,
  getMatchTotal,
  getPlayerMoney,
  onBack,
  onFinish,
  getMatchResultsForHole,
  getMultiplier,
  getMultiplierValue,
}: Props) {
  return (
    <div className="min-h-screen bg-black p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-red-500 text-sm font-medium">
          &lt; Back
        </button>
        <h1 className="text-xl font-bold text-red-500">Scoreboard</h1>
        <div className="w-12" />
      </div>

      {/* Money Summary */}
      <div className="bg-neutral-900 rounded-xl p-4 mb-6">
        <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-3">
          Money Summary
        </h2>
        <div className="space-y-2">
          {players
            .map((p) => ({ player: p, money: getPlayerMoney(p.id) }))
            .sort((a, b) => b.money - a.money)
            .map(({ player, money }) => (
              <div key={player.id} className="flex items-center justify-between bg-neutral-800 rounded-lg p-3">
                <span className="text-white font-medium">{player.name}</span>
                <span
                  className={`font-bold text-lg ${
                    money > 0 ? 'text-red-500' : money < 0 ? 'text-red-400' : 'text-neutral-400'
                  }`}
                >
                  {money >= 0 ? '+' : ''}${money.toFixed(2)}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Match Details */}
      {[1, 2, 3].map((rotation) => {
        const rotationMatches = matches.filter((m) => m.rotation === rotation);
        if (rotationMatches.length === 0) return null;

        return (
          <div key={rotation} className="mb-6">
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-3">
              Rotation {rotation} (Holes {(rotation - 1) * 6 + 1}-{rotation * 6})
            </h2>

            {rotationMatches.map((match) => {
              const total = getMatchTotal(match);
              const t1 = match.team1.map((id) => players.find((p) => p.id === id)?.name || '?');
              const t2 = match.team2.map((id) => players.find((p) => p.id === id)?.name || '?');
              const startHole = (match.rotation - 1) * 6 + 1;
              const endHole = match.rotation * 6;

              return (
                <div key={match.id} className="bg-neutral-900 rounded-xl p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-red-400 text-sm font-semibold">{t1.join(' & ')}</span>
                      <span className="text-neutral-500 text-sm mx-2">vs</span>
                      <span className="text-orange-300 text-sm font-semibold">{t2.join(' & ')}</span>
                    </div>
                    <span className={`font-bold text-lg ${total > 0 ? 'text-red-500' : total < 0 ? 'text-orange-400' : 'text-neutral-400'}`}>
                      {total > 0 ? '+' : ''}{total} pts
                    </span>
                  </div>
                  <div className="text-right text-sm">
                    <span className={`font-semibold ${total > 0 ? 'text-red-500' : total < 0 ? 'text-orange-400' : 'text-neutral-400'}`}>
                      ${Math.abs(total * pointValue).toFixed(2)}
                      {total !== 0 && (
                        <span className="text-neutral-500 ml-1">
                          to {total > 0 ? t1.join(' & ') : t2.join(' & ')}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Hole-by-hole breakdown */}
                  <div className="mt-3 pt-3 border-t border-neutral-800">
                    <div className="grid grid-cols-7 gap-1 text-xs text-center">
                      <div className="text-neutral-500">Hole</div>
                      {Array.from({ length: 6 }, (_, i) => startHole + i).map((h) => (
                        <div key={h} className="text-neutral-500">{h}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-xs text-center mt-1">
                      <div className="text-neutral-500">Pts</div>
                      {Array.from({ length: 6 }, (_, i) => startHole + i).map((h) => {
                        const result = getMatchResultsForHole(match, h);
                        if (!result) return <div key={h} className="text-neutral-600">-</div>;
                        const mult = getMultiplier(match.id, h);
                        const multVal = getMultiplierValue(mult);
                        const pts = result.points * multVal;
                        const multLabel = mult === 'press' ? 'P' : mult === 'roll' ? 'R' : mult === 're-roll' ? 'RR' : '';
                        return (
                          <div
                            key={h}
                            className={`font-semibold ${
                              pts > 0
                                ? 'text-red-500'
                                : pts < 0
                                ? 'text-orange-400'
                                : 'text-neutral-500'
                            }`}
                          >
                            {pts > 0 ? '+' : ''}{pts}
                            {multLabel && <div className="text-yellow-400 text-[9px]">{multLabel}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      <button
        onClick={onFinish}
        className="w-full mt-4 bg-red-600 text-white py-3 rounded-xl font-semibold text-lg"
      >
        Finish & Save Round
      </button>
    </div>
  );
}
