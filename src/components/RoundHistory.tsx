import { useState, useEffect } from 'react';
import { SavedRound } from '../types';
import { loadRounds, deleteRound } from '../utils/storage';
import ShareMenu from './ShareMenu';

interface Props {
  onBack: () => void;
}

export default function RoundHistory({ onBack }: Props) {
  const [rounds, setRounds] = useState<SavedRound[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setRounds(loadRounds());
  }, []);

  const handleDelete = (id: string) => {
    deleteRound(id);
    setRounds(loadRounds());
  };

  return (
    <div className="min-h-screen bg-black p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-red-500 text-sm font-medium">
          &lt; Back
        </button>
        <h1 className="text-xl font-bold text-red-500">Round History</h1>
        <div className="w-12" />
      </div>

      {rounds.length === 0 ? (
        <div className="text-center text-neutral-500 mt-12">
          <p className="text-lg">No saved rounds yet</p>
          <p className="text-sm mt-2">Finish a round to see it here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rounds.map((round) => (
            <div key={round.id} className="bg-neutral-900 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === round.id ? null : round.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">
                      {round.courseName || 'Unnamed Course'}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {new Date(round.date).toLocaleDateString()} | {round.players.length} players
                    </div>
                  </div>
                  <span className="text-neutral-400 text-lg">{expandedId === round.id ? '-' : '+'}</span>
                </div>
              </button>

              {expandedId === round.id && (
                <div className="px-4 pb-4 border-t border-neutral-800 pt-3">
                  <div className="text-xs text-neutral-500 mb-2">
                    Players: {round.players.map((p) => p.name).join(', ')}
                  </div>

                  {round.results.map((result) => (
                    <div key={result.matchId} className="bg-neutral-800 rounded-lg p-3 mb-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-red-400">{result.team1Names}</span>
                          <span className="text-neutral-500 mx-1">vs</span>
                          <span className="text-orange-300">{result.team2Names}</span>
                        </div>
                        <span
                          className={`font-bold text-sm ${
                            result.totalPoints > 0
                              ? 'text-red-500'
                              : result.totalPoints < 0
                              ? 'text-orange-400'
                              : 'text-neutral-400'
                          }`}
                        >
                          {result.totalPoints > 0 ? '+' : ''}
                          {result.totalPoints} (${Math.abs(result.money).toFixed(2)})
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="mt-3">
                    <ShareMenu
                      data={{
                        courseName: round.courseName,
                        date: round.date,
                        players: round.players,
                        holes: round.holes,
                        matches: round.matches,
                        scores: round.scores,
                        results: round.results,
                        pointValue: round.pointsPerDollar,
                      }}
                    />
                  </div>

                  <button
                    onClick={() => handleDelete(round.id)}
                    className="mt-3 text-red-400 text-xs"
                  >
                    Delete Round
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
