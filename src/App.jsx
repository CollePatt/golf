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
import {
  getAutoSwingIntervalMs,
  getExpectedYardsPerSwing,
  getStartingBalls,
  rollSwingYards,
} from './logic/swingLogic.js';
import { getHoleDefinition, getNextCourseId } from './data/courses.js';
import { ACHIEVEMENTS } from './data/achievements.js';
import {
  createCoursePerkChoices,
  getCoursePerkDistanceMultiplier,
  getCoursePerkFocusGain,
  getCoursePerkStartingBalls,
} from './data/coursePerks.js';
import { getSwingMode } from './data/swingModes.js';
import { allocateToUpgrade } from './logic/upgradeLogic.js';
import { saveGame, loadGame, clearSave } from './logic/storage.js';
import HoleScreen from './components/HoleScreen.jsx';
import UpgradeScreen from './components/UpgradeScreen.jsx';
import ScorecardPanel from './components/ScorecardPanel.jsx';
import AchievementsPanel from './components/AchievementsPanel.jsx';
import GuidePanel from './components/GuidePanel.jsx';
import './App.css';

const FOCUS_GAIN_PER_MANUAL_SWING = 18;
const FOCUS_READY = 100;

function applyAchievementUnlocks(state) {
  const newlyUnlocked = ACHIEVEMENTS.filter(achievement => (
    !state.achievements[achievement.id] && achievement.isUnlocked(state)
  ));

  if (newlyUnlocked.length === 0) return state;

  const rewardYards = newlyUnlocked.reduce((total, achievement) => total + achievement.rewardYards, 0);
  const achievements = { ...state.achievements };
  for (const achievement of newlyUnlocked) achievements[achievement.id] = true;

  return {
    ...state,
    achievements,
    recentAchievements: newlyUnlocked.map(achievement => achievement.id),
    totalYardsThisRound: state.totalYardsThisRound + rewardYards,
    yardsToAllocate: state.phase === 'upgrade'
      ? state.yardsToAllocate + rewardYards
      : state.yardsToAllocate,
    lifetimeStats: {
      ...state.lifetimeStats,
      achievementYards: state.lifetimeStats.achievementYards + rewardYards,
    },
  };
}

function updateLifetimeStats(s, swing, holeCleared, courseCompleted) {
  return {
    ...s.lifetimeStats,
    swings: s.lifetimeStats.swings + 1,
    manualSwings: s.lifetimeStats.manualSwings + (swing.source === 'manual' ? 1 : 0),
    autoSwings: s.lifetimeStats.autoSwings + (swing.source === 'auto' ? 1 : 0),
    focusedSwings: s.lifetimeStats.focusedSwings + (swing.quality === 'Focused' ? 1 : 0),
    perfectSwings: s.lifetimeStats.perfectSwings + (swing.quality === 'Perfect' ? 1 : 0),
    yards: s.lifetimeStats.yards + swing.yards,
    holesCleared: s.lifetimeStats.holesCleared + (holeCleared ? 1 : 0),
    coursesCompleted: s.lifetimeStats.coursesCompleted + (courseCompleted ? 1 : 0),
    bestSwing: Math.max(s.lifetimeStats.bestSwing, swing.yards),
  };
}

function addCompletedCourse(completedCourseIds, courseId) {
  return completedCourseIds.includes(courseId)
    ? completedCourseIds
    : [...completedCourseIds, courseId];
}

function advanceSwingState(s, source = 'manual') {
  if (s.phase !== 'run' || s.ballsLeft <= 0) return s;

  const holeDefinition = getHoleDefinition(s.courseId, s.hole);
  const focused = source === 'manual' && s.focusMeter >= FOCUS_READY;
  const coursePerkDistanceMultiplier = getCoursePerkDistanceMultiplier(s.activeCoursePerk);
  const swingMode = getSwingMode(s.selectedSwingMode);
  const swing = rollSwingYards(s.upgrades, s.wind, holeDefinition, {
    focused,
    source,
    distanceMultiplier: coursePerkDistanceMultiplier,
    swingMode: swingMode.id,
  });
  const yards = swing.yards;
  const newYardsThisHole = s.yardsThisHole + yards;
  const newBalls = s.ballsLeft - 1;
  const newHoleShots = s.currentHoleShots + 1;
  const newTotalShots = s.totalShots + 1;
  const newTotalYards = s.totalYardsThisRound + yards;
  const manualFocusGain = FOCUS_GAIN_PER_MANUAL_SWING
    + swingMode.focusGainBonus
    + getCoursePerkFocusGain(s.activeCoursePerk)
    + (swing.event?.focusGain ?? 0);
  const newFocusMeter = source === 'manual'
    ? focused
      ? 0
      : Math.min(FOCUS_READY, s.focusMeter + manualFocusGain)
    : s.focusMeter;

  const holeCleared = newYardsThisHole >= s.targetDistance;
  const lastHole = s.hole >= HOLES_PER_ROUND;
  const courseCompleted = holeCleared && lastHole;
  const lifetimeStats = updateLifetimeStats(s, swing, holeCleared, courseCompleted);
  const nextScorecard = holeCleared
    ? recordHoleScore(s.scorecard, s.hole, newHoleShots, s.courseId)
    : s.scorecard;

  // Round ends: completed all 18 holes, or ran out of balls.
  if (holeCleared && lastHole) {
    const completedRound = summarizeCompletedRound(nextScorecard, newTotalShots, newTotalYards);
    return applyAchievementUnlocks({
      ...s,
      yardsThisHole: newYardsThisHole,
      currentHoleShots: newHoleShots,
      ballsLeft: newBalls,
      totalShots: newTotalShots,
      totalYardsThisRound: newTotalYards,
      lastSwing: swing,
      focusMeter: newFocusMeter,
      lifetimeStats,
      scorecard: nextScorecard,
      roundsCompleted: s.roundsCompleted + 1,
      bestCompletedRound: isBetterCompletedRound(completedRound, s.bestCompletedRound)
        ? completedRound
        : s.bestCompletedRound,
      completedCourseIds: addCompletedCourse(s.completedCourseIds, s.courseId),
      pendingCoursePerkChoices: createCoursePerkChoices(),
      nextCoursePerk: null,
      phase: 'upgrade',
      roundResult: 'complete',
      yardsToAllocate: newTotalYards,
    });
  }

  if (newBalls <= 0) {
    const reachedHole = holeCleared ? Math.min(HOLES_PER_ROUND, s.hole + 1) : s.hole;
    return applyAchievementUnlocks({
      ...s,
      hole: reachedHole,
      targetDistance: yardsForHole(reachedHole, s.courseId),
      yardsThisHole: holeCleared ? 0 : newYardsThisHole,
      currentHoleShots: holeCleared ? 0 : newHoleShots,
      ballsLeft: 0,
      totalShots: newTotalShots,
      totalYardsThisRound: newTotalYards,
      lastSwing: swing,
      focusMeter: newFocusMeter,
      lifetimeStats,
      scorecard: nextScorecard,
      phase: 'upgrade',
      roundResult: 'outOfBalls',
      yardsToAllocate: newTotalYards,
    });
  }

  // Mid-round: hole cleared, advance to the next hole and keep swinging.
  if (holeCleared) {
    const nextHole = s.hole + 1;
    return applyAchievementUnlocks({
      ...s,
      hole: nextHole,
      targetDistance: yardsForHole(nextHole, s.courseId),
      yardsThisHole: 0,
      currentHoleShots: 0,
      ballsLeft: newBalls,
      totalShots: newTotalShots,
      totalYardsThisRound: newTotalYards,
      lastSwing: swing,
      focusMeter: newFocusMeter,
      lifetimeStats,
      scorecard: nextScorecard,
    });
  }

  // Normal swing.
  return applyAchievementUnlocks({
    ...s,
    yardsThisHole: newYardsThisHole,
    currentHoleShots: newHoleShots,
    ballsLeft: newBalls,
    totalShots: newTotalShots,
    totalYardsThisRound: newTotalYards,
    lastSwing: swing,
    focusMeter: newFocusMeter,
    lifetimeStats,
  });
}

export default function App() {
  const [state, setState] = useState(() => loadGame() || createInitialState());
  const [activeTab, setActiveTab] = useState(() => state.phase === 'upgrade' ? 'upgrades' : 'play');

  useEffect(() => {
    saveGame(state);
  }, [state]);

  useEffect(() => {
    if (state.phase === 'upgrade') setActiveTab('upgrades');
  }, [state.phase]);

  const autoSwingIntervalMs = getAutoSwingIntervalMs(state.upgrades);

  useEffect(() => {
    if (state.phase !== 'run' || !state.autoSwingEnabled || !autoSwingIntervalMs) return undefined;
    const intervalId = window.setInterval(() => {
      setState(s => advanceSwingState(s, 'auto'));
    }, autoSwingIntervalMs);
    return () => window.clearInterval(intervalId);
  }, [state.phase, state.autoSwingEnabled, autoSwingIntervalMs]);

  function handleSwing() {
    setState(s => advanceSwingState(s, 'manual'));
  }

  function handleToggleAutoSwing() {
    setState(s => ({
      ...s,
      autoSwingEnabled: !s.autoSwingEnabled,
    }));
  }

  function handleSelectSwingMode(modeId) {
    setState(s => ({
      ...s,
      selectedSwingMode: getSwingMode(modeId).id,
    }));
  }

  function handleAllocate(upgradeId, amount) {
    setState(s => {
      const { upgradeState, yardsToAllocate } = allocateToUpgrade(
        upgradeId,
        s.upgrades,
        s.yardsToAllocate,
        amount
      );
      const hadAutoSwing = Boolean(getAutoSwingIntervalMs(s.upgrades));
      const hasAutoSwing = Boolean(getAutoSwingIntervalMs(upgradeState));
      return {
        ...s,
        upgrades: upgradeState,
        yardsToAllocate,
        autoSwingEnabled: hasAutoSwing && !hadAutoSwing ? true : s.autoSwingEnabled,
      };
    });
  }

  function handleChooseCoursePerk(perkId) {
    setState(s => {
      if (!s.pendingCoursePerkChoices.includes(perkId)) return s;
      return {
        ...s,
        nextCoursePerk: perkId,
      };
    });
  }

  function handleStartNextRound() {
    if (state.roundResult === 'complete' && !state.nextCoursePerk) return;

    setActiveTab('play');
    setState(s => {
      if (s.roundResult === 'complete' && !s.nextCoursePerk) return s;

      const completedRound = s.roundResult === 'complete';
      const nextCourseId = completedRound
        ? getNextCourseId(s.courseId) || s.courseId
        : s.courseId;
      const activeCoursePerk = completedRound ? s.nextCoursePerk : null;

      return {
        ...s,
        phase: 'run',
        courseId: nextCourseId,
        hole: 1,
        targetDistance: yardsForHole(1, nextCourseId),
        yardsThisHole: 0,
        currentHoleShots: 0,
        ballsLeft: getStartingBalls(s.upgrades) + getCoursePerkStartingBalls(activeCoursePerk),
        totalShots: 0,
        totalYardsThisRound: 0,
        yardsToAllocate: 0,
        wind: rollWind(),
        lastSwing: null,
        focusMeter: 0,
        activeCoursePerk,
        pendingCoursePerkChoices: [],
        nextCoursePerk: null,
        recentAchievements: [],
        scorecard: createScorecard(nextCourseId),
        roundResult: null,
      };
    });
  }

  function handleReset() {
    clearSave();
    setActiveTab('play');
    setState(createInitialState());
  }

  const tabs = [
    { id: 'play', label: 'Play' },
    {
      id: 'upgrades',
      label: 'Upgrades',
      badge: state.phase === 'upgrade' && state.roundResult === 'complete' && !state.nextCoursePerk
        ? 'Perk'
        : state.phase === 'upgrade' && state.yardsToAllocate > 0
        ? 'Spend'
        : null,
    },
    { id: 'scorecard', label: 'Scorecard' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'guide', label: 'Guide' },
  ];

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">Incremental golf</p>
          <h1>Golf</h1>
        </div>
        <div className="goal-banner">
          <span>Final Goal</span>
          <strong>Complete courses, unlock new stops, then beat your best score.</strong>
        </div>
      </header>

      <nav className="tabs" aria-label="Game sections">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.badge && <span>{tab.badge}</span>}
          </button>
        ))}
      </nav>

      {activeTab === 'play' && state.phase === 'run' && (
        <HoleScreen
          state={state}
          onSwing={handleSwing}
          onSelectSwingMode={handleSelectSwingMode}
          onToggleAutoSwing={handleToggleAutoSwing}
          yardsPerSwing={getExpectedYardsPerSwing(
            state.upgrades,
            state.wind,
            getHoleDefinition(state.courseId, state.hole),
            getCoursePerkDistanceMultiplier(state.activeCoursePerk),
            state.selectedSwingMode
          )}
          autoSwingIntervalMs={autoSwingIntervalMs}
          focusReady={FOCUS_READY}
        />
      )}

      {activeTab === 'play' && state.phase === 'upgrade' && (
        <div className="screen">
          <h2>Round Ended</h2>
          <p className="hint">Spend your earned yards in the upgrades tab, then choose any unlocked course reward.</p>
          <button className="next-btn" onClick={() => setActiveTab('upgrades')}>
            View Upgrades
          </button>
        </div>
      )}

      {activeTab === 'upgrades' && (
        <UpgradeScreen
          state={state}
          onAllocate={handleAllocate}
          onChooseCoursePerk={handleChooseCoursePerk}
          onStartNextRound={handleStartNextRound}
        />
      )}

      {activeTab === 'scorecard' && <ScorecardPanel state={state} />}

      {activeTab === 'achievements' && <AchievementsPanel state={state} />}

      {activeTab === 'guide' && <GuidePanel />}

      <button className="reset-btn" onClick={handleReset}>
        Reset Game
      </button>
    </div>
  );
}
