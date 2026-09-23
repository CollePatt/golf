import { useState, useEffect } from 'react';
import { createInitialState, yardsForHole, HOLES_PER_ROUND } from './logic/gameState.js';
import { getYardsPerSwing, getStartingBalls } from './logic/swingLogic.js';
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
      const yards = getYardsPerSwing(s.upgrades);
      const newYardsThisHole = s.yardsThisHole + yards;
      const newBalls = s.ballsLeft - 1;
      const newTotalShots = s.totalShots + 1;
      const newTotalYards = s.totalYardsThisRound + yards;

      const holeCleared = newYardsThisHole >= s.targetDistance;
      const lastHole = s.hole >= HOLES_PER_ROUND;

      // Round ends: completed all 18 holes, or ran out of balls.
      if (holeCleared && lastHole) {
        return {
          ...s,
          yardsThisHole: newYardsThisHole,
          ballsLeft: newBalls,
          totalShots: newTotalShots,
          totalYardsThisRound: newTotalYards,
          phase: 'upgrade',
          roundResult: 'complete',
          yardsToAllocate: newTotalYards,
        };
      }

      if (newBalls <= 0 && !holeCleared) {
        return {
          ...s,
          yardsThisHole: newYardsThisHole,
          ballsLeft: 0,
          totalShots: newTotalShots,
          totalYardsThisRound: newTotalYards,
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
          ballsLeft: newBalls,
          totalShots: newTotalShots,
          totalYardsThisRound: newTotalYards,
        };
      }

      // Normal swing.
      return {
        ...s,
        yardsThisHole: newYardsThisHole,
        ballsLeft: newBalls,
        totalShots: newTotalShots,
        totalYardsThisRound: newTotalYards,
      };
    });
  }

  function handleAllocate(upgradeId) {
    const { upgradeState, yardsToAllocate } = allocateToUpgrade(
      upgradeId,
      state.upgrades,
      state.yardsToAllocate
    );
    setState(s => ({
      ...s,
      upgrades: upgradeState,
      yardsToAllocate,
    }));
  }

  function handleStartNextRound() {
    setState(s => ({
      ...s,
      phase: 'run',
      hole: 1,
      targetDistance: yardsForHole(1),
      yardsThisHole: 0,
      ballsLeft: getStartingBalls(s.upgrades),
      totalShots: 0,
      totalYardsThisRound: 0,
      yardsToAllocate: 0,
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
          yardsPerSwing={getYardsPerSwing(state.upgrades)}
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
