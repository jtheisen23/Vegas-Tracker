import { useState, useCallback } from 'react';
import { Player, Match, HoleSetup, Round, Screen, SavedRound, MatchResult, Multiplier } from '../types';
import { calculateStrokesReceived } from '../utils/handicap';
import { calculateVegasPoints, getNetScore } from '../utils/scoring';
import { saveRound } from '../utils/storage';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

const DEFAULT_HOLES: HoleSetup[] = Array.from({ length: 18 }, (_, i) => ({
  number: i + 1,
  par: 4,
  handicapRating: i + 1,
}));

export function useRound() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [players, setPlayers] = useState<Player[]>([
    { id: generateId(), name: '', handicap: 0, strokesReceived: 0 },
    { id: generateId(), name: '', handicap: 0, strokesReceived: 0 },
    { id: generateId(), name: '', handicap: 0, strokesReceived: 0 },
    { id: generateId(), name: '', handicap: 0, strokesReceived: 0 },
  ]);
  const [holes, setHoles] = useState<HoleSetup[]>(DEFAULT_HOLES);
  const [matches, setMatches] = useState<Match[]>([]);
  const [scores, setScores] = useState<Record<string, Record<number, number>>>({});
  const [currentHole, setCurrentHole] = useState(1);
  const [courseName, setCourseName] = useState('');
  const [pointValue, setPointValue] = useState(0.5);
  // matchId -> holeNumber -> Multiplier
  const [multipliers, setMultipliers] = useState<Record<string, Record<number, Multiplier>>>({});

  const addPlayer = useCallback(() => {
    if (players.length >= 5) return;
    setPlayers((prev) => [
      ...prev,
      { id: generateId(), name: '', handicap: 0, strokesReceived: 0 },
    ]);
  }, [players.length]);

  const removePlayer = useCallback((id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updatePlayer = useCallback((id: string, field: keyof Player, value: string | number) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  }, []);

  const updateHole = useCallback((holeNum: number, field: keyof HoleSetup, value: number) => {
    setHoles((prev) =>
      prev.map((h) => (h.number === holeNum ? { ...h, [field]: value } : h))
    );
  }, []);

  const autoGenerateMatches = useCallback(() => {
    if (players.length < 4) return;
    const p = players;
    const newMatches: Match[] = [
      // Rotation 1: Holes 1-6
      { id: generateId(), team1: [p[0].id, p[1].id], team2: [p[2].id, p[3].id], rotation: 1 },
      // Rotation 2: Holes 7-12
      { id: generateId(), team1: [p[0].id, p[2].id], team2: [p[1].id, p[3].id], rotation: 2 },
      // Rotation 3: Holes 13-18
      { id: generateId(), team1: [p[0].id, p[3].id], team2: [p[1].id, p[2].id], rotation: 3 },
    ];

    // If 5th player, add extra matches
    if (players.length === 5) {
      newMatches.push(
        { id: generateId(), team1: [p[0].id, p[4].id], team2: [p[2].id, p[3].id], rotation: 1 },
        { id: generateId(), team1: [p[1].id, p[4].id], team2: [p[0].id, p[3].id], rotation: 2 },
        { id: generateId(), team1: [p[2].id, p[4].id], team2: [p[0].id, p[1].id], rotation: 3 },
      );
    }

    setMatches(newMatches);
  }, [players]);

  const addMatch = useCallback((team1: [string, string], team2: [string, string], rotation: number) => {
    setMatches((prev) => [...prev, { id: generateId(), team1, team2, rotation }]);
  }, []);

  const removeMatch = useCallback((matchId: string) => {
    setMatches((prev) => prev.filter((m) => m.id !== matchId));
  }, []);

  const startRound = useCallback(() => {
    const updated = calculateStrokesReceived(players);
    setPlayers(updated);
    // Initialize empty scores
    const initialScores: Record<string, Record<number, number>> = {};
    updated.forEach((p) => {
      initialScores[p.id] = {};
    });
    setScores(initialScores);
    setCurrentHole(1);
    setScreen('holes');
  }, [players]);

  const setScore = useCallback((playerId: string, holeNumber: number, grossScore: number) => {
    setScores((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [holeNumber]: grossScore,
      },
    }));
  }, []);

  const getMultiplier = useCallback(
    (matchId: string, holeNumber: number): Multiplier => {
      return multipliers[matchId]?.[holeNumber] || 'none';
    },
    [multipliers]
  );

  const getMultiplierValue = useCallback((m: Multiplier): number => {
    switch (m) {
      case 'press': return 2;
      case 'roll': return 4;
      case 're-roll': return 8;
      default: return 1;
    }
  }, []);

  const setMatchMultiplier = useCallback((matchId: string, holeNumber: number, value: Multiplier) => {
    setMultipliers((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [holeNumber]: value,
      },
    }));
  }, []);

  const clearScore = useCallback((playerId: string, holeNumber: number) => {
    setScores((prev) => {
      const playerScores = { ...prev[playerId] };
      delete playerScores[holeNumber];
      return { ...prev, [playerId]: playerScores };
    });
  }, []);

  const getMatchResultsForHole = useCallback(
    (match: Match, holeNumber: number) => {
      const hole = holes.find((h) => h.number === holeNumber);
      if (!hole) return null;

      const p1 = players.find((p) => p.id === match.team1[0]);
      const p2 = players.find((p) => p.id === match.team1[1]);
      const p3 = players.find((p) => p.id === match.team2[0]);
      const p4 = players.find((p) => p.id === match.team2[1]);
      if (!p1 || !p2 || !p3 || !p4) return null;

      const g1 = scores[p1.id]?.[holeNumber];
      const g2 = scores[p2.id]?.[holeNumber];
      const g3 = scores[p3.id]?.[holeNumber];
      const g4 = scores[p4.id]?.[holeNumber];

      if (g1 == null || g2 == null || g3 == null || g4 == null) return null;

      const n1 = getNetScore(g1, p1.strokesReceived, hole.handicapRating);
      const n2 = getNetScore(g2, p2.strokesReceived, hole.handicapRating);
      const n3 = getNetScore(g3, p3.strokesReceived, hole.handicapRating);
      const n4 = getNetScore(g4, p4.strokesReceived, hole.handicapRating);

      return calculateVegasPoints([n1, n2], [n3, n4], hole.par);
    },
    [holes, players, scores]
  );

  const getMatchTotal = useCallback(
    (match: Match) => {
      const startHole = (match.rotation - 1) * 6 + 1;
      const endHole = match.rotation * 6;
      let total = 0;
      for (let h = startHole; h <= endHole; h++) {
        const result = getMatchResultsForHole(match, h);
        if (result) {
          const mult = getMultiplierValue(getMultiplier(match.id, h));
          total += result.points * mult;
        }
      }
      return total;
    },
    [getMatchResultsForHole, getMultiplier, getMultiplierValue]
  );

  const getPlayerMoney = useCallback(
    (playerId: string) => {
      let totalPoints = 0;
      matches.forEach((match) => {
        const total = getMatchTotal(match);
        if (match.team1.includes(playerId)) {
          totalPoints += total;
        } else if (match.team2.includes(playerId)) {
          totalPoints -= total;
        }
      });
      return totalPoints * pointValue;
    },
    [matches, getMatchTotal, pointValue]
  );

  const getCurrentRotation = useCallback(() => {
    if (currentHole <= 6) return 1;
    if (currentHole <= 12) return 2;
    return 3;
  }, [currentHole]);

  const getActiveMatches = useCallback(() => {
    const rotation = getCurrentRotation();
    return matches.filter((m) => m.rotation === rotation);
  }, [matches, getCurrentRotation]);

  const finishRound = useCallback(() => {
    const results: MatchResult[] = matches.map((match) => {
      const total = getMatchTotal(match);
      const t1Names = match.team1.map((id) => players.find((p) => p.id === id)?.name || '').join(' & ');
      const t2Names = match.team2.map((id) => players.find((p) => p.id === id)?.name || '').join(' & ');
      return {
        matchId: match.id,
        team1Names: t1Names,
        team2Names: t2Names,
        totalPoints: total,
        money: total * pointValue,
      };
    });

    const savedRound: SavedRound = {
      id: generateId(),
      date: new Date().toISOString(),
      courseName,
      players,
      holes,
      matches,
      scores,
      pointsPerDollar: pointValue,
      results,
    };

    saveRound(savedRound);
  }, [matches, getMatchTotal, players, courseName, holes, scores, pointValue]);

  return {
    screen,
    setScreen,
    players,
    addPlayer,
    removePlayer,
    updatePlayer,
    holes,
    updateHole,
    matches,
    setMatches,
    autoGenerateMatches,
    addMatch,
    removeMatch,
    scores,
    setScore,
    clearScore,
    currentHole,
    setCurrentHole,
    courseName,
    setCourseName,
    pointValue,
    setPointValue,
    startRound,
    getMatchResultsForHole,
    getMatchTotal,
    getPlayerMoney,
    getCurrentRotation,
    getActiveMatches,
    finishRound,
    multipliers,
    getMultiplier,
    getMultiplierValue,
    setMatchMultiplier,
  };
}
