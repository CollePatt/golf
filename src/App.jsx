import { useState, useEffect } from 'react';
import {
  createInitialState,
  createScorecard,
  yardsForHole,
  HOLES_PER_ROUND,
  recordHoleScore,
  summarizeCompletedRound,
  isBetterCompletedRound,
} from './logic/gameState.js';
import { rollWind } from './logic/runModifiers.js';
import { getExpectedYardsPerSwing, getStartingBalls, rollSwingYards } from './logic/swingLogic.js';
import { allocateToUpgrade } from './logic/upgradeLogic.js';
import { saveGame, loadGame, clearSave } from './logic/storage.js';
import HoleScreen from './components/HoleScreen.jsx';
import UpgradeScreen from './components/UpgradeScreen.jsx';
import './App.css';

export default function App() {
  const [state, setState] = useState(() => loadGame() || createInitialState());

  useEffect(() => {
    saveGame(state);
  }, [state]);

  function handleSwing() {
    setState(s => {
      const swing = rollSwingYards(s.upgrades, s.wind);
      const yards = swing.yards;
      const newYardsThisHole = s.yardsThisHole + yards;
      const newBalls = s.ballsLeft - 1;
      const newHoleShots = s.currentHoleShots + 1;
      const newTotalShots = s.totalShots + 1;
      const newTotalYards = s.totalYardsThisRound + yards;

      const holeCleared = newYardsThisHole >= s.targetDistance;
      const lastHole = s.hole >= HOLES_PER_ROUND;
      const nextScorecard = holeCleared
        ? recordHoleScore(s.scorecard, s.hole, newHoleShots)
        : s.scorecard;

      // Round ends: completed all 18 holes, or ran out of balls.
      if (holeCleared && lastHole) {
        const completedRound = summarizeCompletedRound(nextScorecard, newTotalShots, newTotalYards);
        return {
          ...s,
          yardsThisHole: newYardsThisHole,
          currentHoleShots: newHoleShots,
          ballsLeft: newBalls,
          totalShots: newTotalShots,
          totalYardsThisRound: newTotalYards,
          lastSwing: swing,
          scorecard: nextScorecard,
          roundsCompleted: s.roundsCompleted + 1,
          bestCompletedRound: isBetterCompletedRound(completedRound, s.bestCompletedRound)
            ? completedRound
            : s.bestCompletedRound,
          phase: 'upgrade',
          roundResult: 'complete',
          yardsToAllocate: newTotalYards,
        };
      }

      if (newBalls <= 0) {
        const reachedHole = holeCleared ? Math.min(HOLES_PER_ROUND, s.hole + 1) : s.hole;
        return {
          ...s,
          hole: reachedHole,
          targetDistance: yardsForHole(reachedHole),
          yardsThisHole: holeCleared ? 0 : newYardsThisHole,
          currentHoleShots: holeCleared ? 0 : newHoleShots,
          ballsLeft: 0,
          totalShots: newTotalShots,
          totalYardsThisRound: newTotalYards,
          lastSwing: swing,
          scorecard: nextScorecard,
          phase: 'upgrade',
          roundResult: 'outOfBalls',
          yardsToAllocate: newTotalYards,
        };
      }

      // Mid-round: hole cleared, advance to the next hole and keep swinging.
      if (holeCleared) {
        const nextHole = s.hole + 1;
        return {
          ...s,
          hole: nextHole,
          targetDistance: yardsForHole(nextHole),
          yardsThisHole: 0,
          currentHoleShots: 0,
          ballsLeft: newBalls,
          totalShots: newTotalShots,
          totalYardsThisRound: newTotalYards,
          lastSwing: swing,
          scorecard: nextScorecard,
        };
      }

      // Normal swing.
      return {
        ...s,
        yardsThisHole: newYardsThisHole,
        currentHoleShots: newHoleShots,
        ballsLeft: newBalls,
        totalShots: newTotalShots,
        totalYardsThisRound: newTotalYards,
        lastSwing: swing,
      };
    });
  }

  function handleAllocate(upgradeId, amount) {
    setState(s => {
      const { upgradeState, yardsToAllocate } = allocateToUpgrade(
        upgradeId,
        s.upgrades,
        s.yardsToAllocate,
        amount
      );
      return {
        ...s,
        upgrades: upgradeState,
        yardsToAllocate,
      };
    });
  }

  function handleStartNextRound() {
    setState(s => ({
      ...s,
      phase: 'run',
      hole: 1,
      targetDistance: yardsForHole(1),
      yardsThisHole: 0,
      currentHoleShots: 0,
      ballsLeft: getStartingBalls(s.upgrades),
      totalShots: 0,
      totalYardsThisRound: 0,
      yardsToAllocate: 0,
      wind: rollWind(),
      lastSwing: null,
      scorecard: createScorecard(),
      roundResult: null,
    }));
  }

  function handleReset() {
    clearSave();
    setState(createInitialState());
  }

  return (
    <div className="app">
      <h1>Golf</h1>

      {state.phase === 'run' && (
        <HoleScreen
          state={state}
          onSwing={handleSwing}
          yardsPerSwing={getExpectedYardsPerSwing(state.upgrades, state.wind)}
        />
      )}

      {state.phase === 'upgrade' && (
        <UpgradeScreen
          state={state}
          onAllocate={handleAllocate}
          onStartNextRound={handleStartNextRound}
        />
      )}

      <button className="reset-btn" onClick={handleReset}>
        Reset Game
      </button>
    </div>
  );
}
