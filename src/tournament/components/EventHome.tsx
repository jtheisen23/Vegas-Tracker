import type { Tournament, TourGroup } from '../types';
import { randomizeGroups } from '../randomize';
import { PLAY_DAY_LABELS, formatPlayDate } from '../dateUtils';

interface Props {
  tournament: Tournament;
  onOpenGroup: (groupId: string) => void;
  onOpenLeaderboard: () => void;
  onOpenRegistration: () => void;
  onSetGroups: (groups: TourGroup[]) => void;
  onEditSetup: () => void;
  onExit: () => void;
}

export default function EventHome({
  tournament,
  onOpenGroup,
  onOpenLeaderboard,
  onOpenRegistration,
  onSetGroups,
  onEditSetup,
  onExit,
}: Props) {
  const registered = Object.values(tournament.players);
  const handleRandomize = () => {
    if (registered.length === 0) return;
    const ok =
      tournament.groups.length === 0 ||
      confirm('Replace existing groups with a fresh random draw?');
    if (!ok) return;
    onSetGroups(randomizeGroups(registered, 4));
  };
  const base = `${window.location.origin}${window.location.pathname}`;
  const leaderboardUrl = `${base}#/t/${tournament.id}/leaderboard`;
  const registrationUrl = `${base}#/t/${tournament.id}/register`;

  const copy = async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert(`${label} link copied`);
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
        <div className="flex items-center gap-2">
          <div className="text-xs text-neutral-500 uppercase tracking-widest">
            {tournament.playDay ? `${PLAY_DAY_LABELS[tournament.playDay]} play` : 'Tournament'}
          </div>
          {tournament.playDay && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                tournament.playDay === 'friday'
                  ? 'bg-sky-700 text-sky-100'
                  : 'bg-amber-700 text-amber-100'
              }`}
            >
              {PLAY_DAY_LABELS[tournament.playDay].toUpperCase()}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold">{tournament.name}</h1>
        <p className="text-sm text-neutral-400">
          {tournament.courseName} · {formatPlayDate(tournament.date)}
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
        onClick={onOpenRegistration}
        className="w-full py-3 bg-sky-700 text-white font-bold rounded-lg mb-2"
      >
        Open sign-up page
      </button>
      <div className="grid grid-cols-2 gap-2 mb-6">
        <button
          onClick={() => copy(registrationUrl, 'Sign-up')}
          className="py-2 bg-neutral-900 text-neutral-300 text-xs rounded-lg"
        >
          Copy sign-up link
        </button>
        <button
          onClick={() => copy(leaderboardUrl, 'Leaderboard')}
          className="py-2 bg-neutral-900 text-neutral-300 text-xs rounded-lg"
        >
          Copy leaderboard link
        </button>
      </div>

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs uppercase tracking-widest text-neutral-500">Groups</h2>
        {registered.length > 0 && (
          <button
            onClick={handleRandomize}
            className="text-xs bg-emerald-700 text-white px-3 py-1.5 rounded font-semibold"
          >
            🎲 Randomize foursomes
          </button>
        )}
      </div>
      {tournament.groups.length === 0 && (
        <p className="text-sm text-neutral-500">
          {registered.length === 0
            ? 'No registrations yet. Share the sign-up link above.'
            : `${registered.length} registered. Tap Randomize to draw foursomes.`}
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
