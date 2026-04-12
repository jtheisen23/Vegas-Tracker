import { useRound } from './hooks/useRound';
import SetupScreen from './components/SetupScreen';
import HoleEntry from './components/HoleEntry';
import Scoreboard from './components/Scoreboard';
import RoundHistory from './components/RoundHistory';

function App() {
  const round = useRound();

  if (round.screen === 'history') {
    return <RoundHistory onBack={() => round.setScreen('setup')} />;
  }

  if (round.screen === 'scoreboard') {
    return (
      <Scoreboard
        players={round.players}
        matches={round.matches}
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
    );
  }

  if (round.screen === 'holes') {
    return (
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
      />
    );
  }

  return (
    <div className="relative">
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
      />
      <button
        onClick={() => round.setScreen('history')}
        className="fixed bottom-4 right-4 bg-neutral-800 text-neutral-300 px-4 py-2 rounded-lg text-sm"
      >
        History
      </button>
    </div>
  );
}

export default App;
