import { useEffect, useState } from 'react';
import { useRound } from './hooks/useRound';
import SetupScreen from './components/SetupScreen';
import HoleEntry from './components/HoleEntry';
import Scoreboard from './components/Scoreboard';
import RoundHistory from './components/RoundHistory';
import Scorecard from './components/Scorecard';
import TournamentApp from './tournament/TournamentApp';

function useHashRoute(): [string, (next: string) => void] {
  const [hash, setHash] = useState(() => window.location.hash || '#/');
  useEffect(() => {
    const on = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const navigate = (next: string) => {
    window.location.hash = next;
  };
  return [hash, navigate];
}

function ModePicker({ onPick }: { onPick: (hash: string) => void }) {
  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <div className="text-6xl mb-2">⛳</div>
        <h1 className="text-3xl font-bold">Golf App</h1>
        <p className="text-sm text-neutral-400 mt-1">Pick a mode</p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={() => onPick('#/t')}
          className="w-full p-5 bg-emerald-700 rounded-2xl text-left active:bg-emerald-800"
        >
          <div className="font-bold text-lg">Tournament</div>
          <div className="text-sm text-emerald-100/80">
            Multiple groups, live leaderboard, handicaps
          </div>
        </button>

        <button
          onClick={() => onPick('#/vegas')}
          className="w-full p-5 bg-red-700 rounded-2xl text-left active:bg-red-800"
        >
          <div className="font-bold text-lg">Vegas</div>
          <div className="text-sm text-red-100/80">
            Rotating partners game with presses
          </div>
        </button>
      </div>

      <p className="text-[10px] text-neutral-600 mt-10 text-center max-w-xs">
        Tournament data syncs across tabs on this device. For true cross-device
        live scoring, wire a real backend in <code>src/tournament/sync.ts</code>.
      </p>
    </div>
  );
}

function VegasApp({ onExit }: { onExit: () => void }) {
  const round = useRound();

  const resetVegas = () => {
    if (!confirm('Clear all Vegas data on this device (active round + saved history)?')) return;
    try {
      localStorage.removeItem('vegas-golf-active-round');
      localStorage.removeItem('vegas-golf-rounds');
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  const TopBar = () => (
    <div className="sticky top-0 z-50 bg-black/95 backdrop-blur border-b border-neutral-800 px-3 py-2 flex items-center justify-between text-sm">
      <button onClick={onExit} className="text-neutral-400">
        ← Home
      </button>
      <span className="text-red-500 font-bold tracking-widest text-xs">VEGAS</span>
      <button onClick={resetVegas} className="text-red-400 text-xs">
        Reset
      </button>
    </div>
  );

  if (round.screen === 'history') {
    return (
      <>
        <TopBar />
        <RoundHistory
          onBack={() => round.setScreen('setup')}
          onEditRound={(saved) => round.loadSavedRound(saved)}
        />
      </>
    );
  }

  if (round.screen === 'scorecard') {
    return (
      <>
        <TopBar />
        <Scorecard
          players={round.players}
          holes={round.holes}
          scores={round.scores}
          courseName={round.courseName}
          onBack={() => round.setScreen('holes')}
        />
      </>
    );
  }

  if (round.screen === 'scoreboard') {
    return (
      <>
        <TopBar />
        <Scoreboard
          players={round.players}
          matches={round.matches}
          holes={round.holes}
          scores={round.scores}
          courseName={round.courseName}
          pointValue={round.pointValue}
          getMatchTotal={round.getMatchTotal}
          getPlayerMoney={round.getPlayerMoney}
          getMatchResultsForHole={round.getMatchResultsForHole}
          getMultiplier={round.getMultiplier}
          getMultiplierValue={round.getMultiplierValue}
          onBack={() => round.setScreen('holes')}
          onFinish={() => {
            round.finishRound();
            round.setScreen('history');
          }}
        />
      </>
    );
  }

  if (round.screen === 'holes') {
    return (
      <>
        <TopBar />
        <HoleEntry
          players={round.players}
          holes={round.holes}
          matches={round.matches}
          scores={round.scores}
          currentHole={round.currentHole}
          onSetCurrentHole={round.setCurrentHole}
          onSetScore={round.setScore}
          onClearScore={round.clearScore}
          onShowScoreboard={() => round.setScreen('scoreboard')}
          onShowScorecard={() => round.setScreen('scorecard')}
          getMatchResultsForHole={round.getMatchResultsForHole}
          getActiveMatches={round.getActiveMatches}
          getCurrentRotation={round.getCurrentRotation}
          getMultiplier={round.getMultiplier}
          getMultiplierValue={round.getMultiplierValue}
          onSetMultiplier={round.setMatchMultiplier}
          onUpdatePlayer={round.updatePlayer}
          handicapMode={round.handicapMode}
          onSetHandicapMode={round.setHandicapMode}
          onRecalculateStrokes={round.recalculateStrokes}
          onAutoGenerateMatches={round.autoGenerateMatches}
          onAddMatch={round.addMatch}
          onRemoveMatch={round.removeMatch}
          onSetMatches={round.setMatches}
        />
      </>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-neutral-100">
      <TopBar />
      <SetupScreen
        players={round.players}
        holes={round.holes}
        matches={round.matches}
        courseName={round.courseName}
        pointValue={round.pointValue}
        onUpdatePlayer={round.updatePlayer}
        onAddPlayer={round.addPlayer}
        onRemovePlayer={round.removePlayer}
        onUpdateHole={round.updateHole}
        onAutoGenerateMatches={round.autoGenerateMatches}
        onAddMatch={round.addMatch}
        onRemoveMatch={round.removeMatch}
        onSetMatches={round.setMatches}
        onSetCourseName={round.setCourseName}
        onSetPointValue={round.setPointValue}
        handicapMode={round.handicapMode}
        onSetHandicapMode={round.setHandicapMode}
        onStart={round.startRound}
        onNewGame={round.resetForNewGame}
      />
      <div className="fixed bottom-4 right-4 flex gap-2">
        <button
          onClick={() => round.setScreen('history')}
          className="bg-neutral-800 text-neutral-300 px-4 py-2 rounded-lg text-sm"
        >
          History
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [hash, navigate] = useHashRoute();

  if (hash.startsWith('#/vegas')) {
    return <VegasApp onExit={() => navigate('#/')} />;
  }

  if (hash.startsWith('#/t')) {
    return (
      <TournamentApp
        route={hash}
        onNavigate={navigate}
        onExit={() => navigate('#/')}
      />
    );
  }

  return <ModePicker onPick={navigate} />;
}
