import type { Tournament } from '../types';

interface Props {
  tournament: Tournament;
  onOpenGroup: (groupId: string) => void;
  onOpenLeaderboard: () => void;
  onEditSetup: () => void;
  onExit: () => void;
}

export default function EventHome({
  tournament,
  onOpenGroup,
  onOpenLeaderboard,
  onEditSetup,
  onExit,
}: Props) {
  const shareUrl = `${window.location.origin}${window.location.pathname}#/t/${tournament.id}/leaderboard`;

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Leaderboard link copied');
    } catch {
      /* clipboard unavailable */
    }
  };

  const totalPlayers = Object.keys(tournament.players).length;
  const totalGroups = tournament.groups.length;
  const totalScoresPosted = Object.values(tournament.scores).reduce(
    (acc, g) => acc + Object.values(g).reduce((a, s) => a + Object.keys(s).length, 0),
    0,
  );

  return (
    <div className="min-h-screen bg-black text-neutral-100 p-4 pb-8">
      <header className="mb-4 flex items-start justify-between">
        <button onClick={onExit} className="text-sm text-neutral-400">
          ← All events
        </button>
        <button onClick={onEditSetup} className="text-sm text-emerald-400">
          Edit setup
        </button>
      </header>

      <div className="mb-6">
        <div className="text-xs text-neutral-500 uppercase tracking-widest">Tournament</div>
        <h1 className="text-2xl font-bold">{tournament.name}</h1>
        <p className="text-sm text-neutral-400">
          {tournament.courseName} · {tournament.date}
        </p>
        <div className="mt-2 flex gap-3 text-xs text-neutral-500">
          <span>{totalPlayers} players</span>
          <span>{totalGroups} groups</span>
          <span>{totalScoresPosted} scores posted</span>
        </div>
      </div>

      <button
        onClick={onOpenLeaderboard}
        className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg mb-2"
      >
        View live leaderboard
      </button>
      <button
        onClick={copyShare}
        className="w-full py-2 bg-neutral-900 text-neutral-300 text-sm rounded-lg mb-6"
      >
        Copy leaderboard link
      </button>

      <h2 className="text-xs uppercase tracking-widest text-neutral-500 mb-2">Groups</h2>
      {tournament.groups.length === 0 && (
        <p className="text-sm text-neutral-500">
          No groups yet. Use Edit setup to add players and groups.
        </p>
      )}
      <div className="space-y-2">
        {tournament.groups.map((g) => {
          const playerNames = g.playerIds
            .map((id) => tournament.players[id]?.name || '?')
            .join(', ');
          const scored = Object.values(tournament.scores[g.id] || {}).reduce(
            (a, s) => a + Object.keys(s).length,
            0,
          );
          const expected = g.playerIds.length * tournament.holes.length;
          return (
            <button
              key={g.id}
              onClick={() => onOpenGroup(g.id)}
              className="w-full text-left bg-neutral-900 rounded-lg p-3 flex items-center justify-between active:bg-neutral-800"
            >
              <div>
                <div className="font-semibold">{g.name}</div>
                <div className="text-xs text-neutral-500">{playerNames || 'No players'}</div>
                {g.teeTime && (
                  <div className="text-xs text-neutral-500">Tee {g.teeTime}</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-neutral-500">Progress</div>
                <div className="font-mono text-sm">
                  {scored}/{expected}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
