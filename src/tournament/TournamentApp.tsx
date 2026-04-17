import { useEffect, useState } from 'react';
import { useTournament } from './useTournament';
import EventsList from './components/EventsList';
import EventHome from './components/EventHome';
import TournamentSetup from './components/TournamentSetup';
import GroupScoring from './components/GroupScoring';
import Leaderboard from './components/Leaderboard';
import Registration from './components/Registration';
import { syncKind } from './sync';

interface Props {
  route: string;
  onNavigate: (hash: string) => void;
  onExit: () => void;
}

/**
 * Routes handled here (hash-based so URLs are shareable):
 *   #/t                             → tournaments list
 *   #/t/:id                         → event home (groups list, leaderboard link)
 *   #/t/:id/setup                   → edit event (players, groups, holes, details)
 *   #/t/:id/group/:groupId          → live scoring for a group
 *   #/t/:id/leaderboard             → live leaderboard
 */
export default function TournamentApp({ route, onNavigate, onExit }: Props) {
  const parts = route.replace(/^#?\/?t\/?/, '').split('/').filter(Boolean);
  const eventId = parts[0] || null;
  const section = parts[1] || null;
  const sectionArg = parts[2] || null;

  const { tournament, setScore, addPlayer, updatePlayer, removePlayer,
    addGroup, updateGroup, removeGroup, setGroups, updateHole, updateMeta } = useTournament(eventId);

  // Grace window for Firestore to respond on a cold open. LocalSync is
  // synchronous so any missing record is immediately known.
  const [graceExpired, setGraceExpired] = useState(false);
  const [waitKey, setWaitKey] = useState<string | null>(null);
  const currentWaitKey = eventId && !tournament ? eventId : null;
  if (waitKey !== currentWaitKey) {
    setWaitKey(currentWaitKey);
    setGraceExpired(false);
  }
  useEffect(() => {
    if (!currentWaitKey) return;
    const ms = syncKind === 'firebase' ? 8000 : 0;
    const t = setTimeout(() => setGraceExpired(true), ms);
    return () => clearTimeout(t);
  }, [currentWaitKey]);

  if (!eventId) {
    return (
      <EventsList
        onOpenEvent={(id) => onNavigate(`#/t/${id}`)}
        onOpenRegistration={(id) => onNavigate(`#/t/${id}/register`)}
        onOpenLeaderboard={(id) => onNavigate(`#/t/${id}/leaderboard`)}
        onExit={onExit}
      />
    );
  }

  if (!tournament && !graceExpired) {
    return (
      <div className="min-h-screen bg-black text-neutral-100 flex flex-col items-center justify-center">
        <div className="text-4xl mb-4 animate-pulse">⛳</div>
        <p className="text-neutral-400 text-sm">Loading tournament…</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-black text-neutral-100 p-6 flex flex-col items-center justify-center">
        <p className="text-neutral-400 mb-4">Tournament not found.</p>
        <p className="text-neutral-500 text-sm mb-6 text-center max-w-sm">
          {syncKind === 'firebase'
            ? 'The link may be invalid or the event was deleted.'
            : 'Tournament data is stored locally. Cross-device sync needs Firebase — set VITE_FIREBASE_* env vars.'}
        </p>
        <button
          onClick={() => onNavigate('#/t')}
          className="px-4 py-2 bg-emerald-600 rounded-lg text-white font-semibold"
        >
          See my tournaments
        </button>
      </div>
    );
  }

  if (section === 'setup') {
    return (
      <TournamentSetup
        tournament={tournament}
        onAddPlayer={addPlayer}
        onUpdatePlayer={updatePlayer}
        onRemovePlayer={removePlayer}
        onAddGroup={addGroup}
        onUpdateGroup={updateGroup}
        onRemoveGroup={removeGroup}
        onSetGroups={setGroups}
        onUpdateHole={updateHole}
        onUpdateMeta={updateMeta}
        onStart={() => onNavigate(`#/t/${tournament.id}`)}
      />
    );
  }

  if (section === 'register') {
    return (
      <Registration
        tournament={tournament}
        onAddPlayer={addPlayer}
        onRemovePlayer={removePlayer}
        onBack={() => onNavigate(`#/t/${tournament.id}`)}
      />
    );
  }

  if (section === 'leaderboard') {
    return (
      <Leaderboard
        tournament={tournament}
        onBack={() => onNavigate(`#/t/${tournament.id}`)}
      />
    );
  }

  if (section === 'group' && sectionArg) {
    return (
      <GroupScoring
        tournament={tournament}
        groupId={sectionArg}
        onSetScore={setScore}
        onOpenLeaderboard={() => onNavigate(`#/t/${tournament.id}/leaderboard`)}
        onBack={() => onNavigate(`#/t/${tournament.id}`)}
      />
    );
  }

  return (
    <EventHome
      tournament={tournament}
      onOpenGroup={(gid) => onNavigate(`#/t/${tournament.id}/group/${gid}`)}
      onOpenLeaderboard={() => onNavigate(`#/t/${tournament.id}/leaderboard`)}
      onOpenRegistration={() => onNavigate(`#/t/${tournament.id}/register`)}
      onSetGroups={setGroups}
      onEditSetup={() => onNavigate(`#/t/${tournament.id}/setup`)}
      onExit={() => onNavigate('#/t')}
    />
  );
}
