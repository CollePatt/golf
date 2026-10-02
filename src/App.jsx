import { useState, useEffect, useRef } from 'react';
import {
  createInitialState,
  createScorecard,
  yardsForHole,
  HOLES_PER_ROUND,
  recordHoleScore,
  summarizeCompletedRound,
  isBetterCompletedRound,
  recordCourseRound,
} from './logic/gameState.js';
import { rollWind } from './logic/runModifiers.js';
import {
  getAutoSwingIntervalMs,
  getCoursePassLevel,
  getEffectLevels,
  getStartingBalls,
  getYardsEarnedMultiplier,
} from './logic/swingLogic.js';
import { applyTurnPro, buyProUpgrade, canTurnPro } from './logic/prestigeLogic.js';
import { getShotExpectedYards, playShot } from './logic/holeLogic.js';
import { COURSES, PRO_CHAIN_COURSE_IDS, getNextCourseId, isCourseUnlocked } from './data/courses.js';
import { ACHIEVEMENTS } from './data/achievements.js';
import { getBallEffects, isBallUnlocked } from './data/balls.js';
import {
  collectPickups,
  consumeSwingBuffs,
  createBuffs,
  getHolePickupKey,
  withHolePickups,
} from './logic/pickupLogic.js';
import {
  createCoursePerkChoices,
  getCoursePerkFocusGain,
  getCoursePerkStartingBalls,
} from './data/coursePerks.js';
import { getSwingMode } from './data/swingModes.js';
import { allocateToUpgrade } from './logic/upgradeLogic.js';
import { saveGame, loadGame, clearSave } from './logic/storage.js';
import HoleScreen from './components/HoleScreen.jsx';
import Clubhouse from './components/Clubhouse.jsx';
import Overlay from './components/Overlay.jsx';
import ScorecardPanel from './components/ScorecardPanel.jsx';
import GuidePanel from './components/GuidePanel.jsx';
import BallBagPanel from './components/BallBagPanel.jsx';
import './App.css';

const FOCUS_GAIN_PER_MANUAL_SWING = 18;
const FOCUS_READY = 100;
// Manual swings wait for the ball-flight animation, so click spam can't outrun it.
const MANUAL_SWING_COOLDOWN_MS = 700;

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
    putts: s.lifetimeStats.putts + (swing.putting?.putts ?? 0),
    onePutts: s.lifetimeStats.onePutts + (swing.putting?.putts === 1 ? 1 : 0),
    holeOuts: s.lifetimeStats.holeOuts + (swing.putting?.putts === 0 ? 1 : 0),
    waterBalls: s.lifetimeStats.waterBalls + (swing.hazard?.type === 'water' ? 1 : 0),
  };
}

function addCompletedCourse(completedCourseIds, courseId) {
  return completedCourseIds.includes(courseId)
    ? completedCourseIds
    : [...completedCourseIds, courseId];
}

function getCourseUnlockContext(s) {
  return {
    completedCourseIds: s.completedCourseIds,
    coursePassLevel: getCoursePassLevel(getEffectLevels(s)),
  };
}

// After finishing a course, queue the next stop on the tour if it is open.
function getDefaultNextCourseId(s) {
  const nextCourseId = getNextCourseId(s.courseId);
  return nextCourseId && isCourseUnlocked(nextCourseId, getCourseUnlockContext(s))
    ? nextCourseId
    : s.courseId;
}

function getEarnedUpgradeYards(s, totalYards) {
  return Math.round(
    totalYards
      * getYardsEarnedMultiplier(getEffectLevels(s))
      * (getBallEffects(s).yardsEarnedMult ?? 1)
  );
}

function advanceSwingState(prev, source = 'manual') {
  if (prev.phase !== 'run' || prev.ballsLeft <= 0) return prev;

  const focused = source === 'manual' && prev.focusMeter >= FOCUS_READY;
  const swingMode = getSwingMode(prev.selectedSwingMode);
  const ready = withHolePickups(prev);
  const shot = playShot(ready, { source, focused });
  // Pickups are collected where the ball stops; their rewards land before the
  // swing is folded into round state, so an Extra Ball can save the round.
  const pickupResult = collectPickups(
    { ...ready, buffs: consumeSwingBuffs(ready.buffs) },
    shot.restAt,
    shot.swing.expectedYards
  );
  const s = {
    ...pickupResult.state,
    buffs: shot.holeCleared
      ? { ...pickupResult.state.buffs, magnet: false }
      : pickupResult.state.buffs,
  };
  const resolvedSwing = pickupResult.collected.length > 0
    ? { ...shot.swing, pickups: pickupResult.collected }
    : shot.swing;
  const swing = resolvedSwing;
  const yards = shot.swing.yards;
  const newYardsThisHole = shot.yardsThisHole;

  const newBalls = Math.max(0, s.ballsLeft - shot.ballsUsed);
  const newHoleShots = s.currentHoleShots + shot.strokes;
  const newTotalShots = s.totalShots + shot.strokes;
  // Yards hit become upgrade currency; Safe swings pay a premium for the shorter carry.
  const newTotalYards = s.totalYardsThisRound + Math.round(yards * (swingMode.yardsEarnedMult ?? 1));
  const manualFocusGain = FOCUS_GAIN_PER_MANUAL_SWING
    + swingMode.focusGainBonus
    + getCoursePerkFocusGain(s.activeCoursePerk)
    + (swing.event?.focusGain ?? 0);
  const swingFocusMeter = source === 'manual'
    ? focused
      ? 0
      : Math.min(FOCUS_READY, s.focusMeter + manualFocusGain)
    : s.focusMeter;
  const newFocusMeter = pickupResult.fillFocus ? FOCUS_READY : swingFocusMeter;

  const holeCleared = shot.holeCleared;
  const lastHole = s.hole >= HOLES_PER_ROUND;
  const courseCompleted = holeCleared && lastHole;
  const lifetimeStats = updateLifetimeStats(s, resolvedSwing, holeCleared, courseCompleted);
  const nextScorecard = holeCleared
    ? recordHoleScore(s.scorecard, s.hole, newHoleShots, s.courseId)
    : s.scorecard;

  // Round ends: completed all 18 holes, or ran out of balls.
  if (holeCleared && lastHole) {
    const completedRound = summarizeCompletedRound(nextScorecard, newTotalShots, newTotalYards);
    const completedCourseIds = addCompletedCourse(s.completedCourseIds, s.courseId);
    return applyAchievementUnlocks({
      ...s,
      yardsThisHole: newYardsThisHole,
      currentHoleShots: newHoleShots,
      ballsLeft: newBalls,
      totalShots: newTotalShots,
      totalYardsThisRound: newTotalYards,
      lastSwing: resolvedSwing,
      focusMeter: newFocusMeter,
      lifetimeStats,
      scorecard: nextScorecard,
      lie: 'fairway',
      roundsCompleted: s.roundsCompleted + 1,
      bestCompletedRound: isBetterCompletedRound(completedRound, s.bestCompletedRound)
        ? completedRound
        : s.bestCompletedRound,
      completedCourseIds,
      selectedCourseId: getDefaultNextCourseId({ ...s, completedCourseIds }),
      cycleBestRounds: recordCourseRound(s.cycleBestRounds, s.courseId, completedRound),
      courseRecords: recordCourseRound(s.courseRecords, s.courseId, completedRound),
      pendingCoursePerkChoices: createCoursePerkChoices(),
      nextCoursePerk: null,
      phase: 'upgrade',
      roundResult: 'complete',
      yardsToAllocate: s.yardsToAllocate + getEarnedUpgradeYards(s, newTotalYards),
      cycleYardsEarned: s.cycleYardsEarned + getEarnedUpgradeYards(s, newTotalYards),
    });
  }

  if (newBalls <= 0) {
    const reachedHole = holeCleared ? Math.min(HOLES_PER_ROUND, s.hole + 1) : s.hole;
    return applyAchievementUnlocks({
      ...s,
      hole: reachedHole,
      targetDistance: yardsForHole(reachedHole, s.courseId),
      yardsThisHole: holeCleared ? 0 : newYardsThisHole,
      lie: holeCleared ? 'fairway' : shot.lie,
      currentHoleShots: holeCleared ? 0 : newHoleShots,
      ballsLeft: 0,
      totalShots: newTotalShots,
      totalYardsThisRound: newTotalYards,
      lastSwing: resolvedSwing,
      focusMeter: newFocusMeter,
      lifetimeStats,
      scorecard: nextScorecard,
      phase: 'upgrade',
      roundResult: 'outOfBalls',
      yardsToAllocate: s.yardsToAllocate + getEarnedUpgradeYards(s, newTotalYards),
      cycleYardsEarned: s.cycleYardsEarned + getEarnedUpgradeYards(s, newTotalYards),
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
      lie: 'fairway',
      ballsLeft: newBalls,
      totalShots: newTotalShots,
      totalYardsThisRound: newTotalYards,
      lastSwing: resolvedSwing,
      focusMeter: newFocusMeter,
      lifetimeStats,
      scorecard: nextScorecard,
    });
  }

  // Normal swing.
  return applyAchievementUnlocks({
    ...s,
    yardsThisHole: newYardsThisHole,
    lie: shot.lie,
    currentHoleShots: newHoleShots,
    ballsLeft: newBalls,
    totalShots: newTotalShots,
    totalYardsThisRound: newTotalYards,
    lastSwing: resolvedSwing,
    focusMeter: newFocusMeter,
    lifetimeStats,
  });
}

// A fresh round on the selected course. A completed round brings its chosen perk.
function startNextRoundState(s) {
  const completedRound = s.roundResult === 'complete';
  const nextCourseId = isCourseUnlocked(s.selectedCourseId, getCourseUnlockContext(s))
    ? s.selectedCourseId
    : COURSES[0].id;
  const activeCoursePerk = completedRound ? s.nextCoursePerk : null;

  return {
    ...s,
    phase: 'run',
    courseId: nextCourseId,
    selectedCourseId: nextCourseId,
    hole: 1,
    targetDistance: yardsForHole(1, nextCourseId),
    yardsThisHole: 0,
    currentHoleShots: 0,
    lie: 'fairway',
    ballsLeft: getStartingBalls(getEffectLevels(s)) + getCoursePerkStartingBalls(activeCoursePerk),
    totalShots: 0,
    totalYardsThisRound: 0,
    // Unspent yards carry over to the next Clubhouse visit.
    wind: rollWind(),
    lastSwing: null,
    focusMeter: 0,
    activeCoursePerk,
    pendingCoursePerkChoices: [],
    nextCoursePerk: null,
    recentAchievements: [],
    lastProResult: null,
    holePickups: null,
    buffs: createBuffs(),
    scorecard: createScorecard(nextCourseId),
    roundResult: null,
  };
}

function formatDuration(ms) {
  const minutes = Math.round(ms / 60000);
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours} h ${minutes % 60} min` : `${minutes} min`;
}

// Idle time is capped so a long absence pays well without replacing play.
const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000;
const OFFLINE_MIN_MS = 60 * 1000;
const MAX_CATCH_UP_SWINGS = 40000;

/**
 * Play every Auto Caddie swing that fits in elapsedMs. Used to catch up a
 * throttled background tab and, with continueRounds, to play while the game
 * was closed: each finished round tees off again on the same course (no perk)
 * and its yards are banked for the next Clubhouse visit.
 */
function playAutoSwings(state, elapsedMs, { continueRounds = false } = {}) {
  let s = state;
  let remaining = elapsedMs;
  let swings = 0;
  let rounds = 0;
  while (swings < MAX_CATCH_UP_SWINGS) {
    const intervalMs = getAutoSwingIntervalMs(getEffectLevels(s));
    if (!intervalMs || !s.autoSwingEnabled || remaining < intervalMs) break;
    if (s.phase !== 'run') {
      if (!continueRounds) break;
      s = startNextRoundState({ ...s, nextCoursePerk: null, roundResult: null });
    }
    remaining -= intervalMs;
    s = advanceSwingState(s, 'auto');
    swings += 1;
    if (s.phase !== 'run') rounds += 1;
  }
  return { state: s, swings, rounds };
}

function loadWithOfflineProgress() {
  const saved = loadGame();
  if (!saved) return { state: createInitialState(), away: null };
  const awayMs = Math.min(OFFLINE_CAP_MS, Date.now() - (saved.savedAt ?? Date.now()));
  if (awayMs < OFFLINE_MIN_MS) return { state: saved, away: null };

  const result = playAutoSwings(saved, awayMs, { continueRounds: true });
  if (result.swings === 0) return { state: saved, away: null };
  return {
    state: result.state,
    away: {
      awayMs,
      swings: result.swings,
      rounds: result.rounds,
      holes: result.state.lifetimeStats.holesCleared - saved.lifetimeStats.holesCleared,
      yards: result.state.cycleYardsEarned - saved.cycleYardsEarned,
    },
  };
}

export default function App() {
  const [boot] = useState(loadWithOfflineProgress);
  const [state, setState] = useState(boot.state);
  const [awayReport, setAwayReport] = useState(boot.away);
  const [view, setView] = useState(() => state.phase === 'upgrade' ? 'clubhouse' : 'course');
  const [door, setDoor] = useState('shop');
  const [overlay, setOverlay] = useState(null);

  useEffect(() => {
    saveGame(state);
  }, [state]);

  useEffect(() => {
    if (state.phase === 'upgrade') {
      setView('clubhouse');
      setDoor('shop');
      setOverlay(null);
    }
  }, [state.phase]);

  const effectLevels = getEffectLevels(state);
  const holePickupKey = getHolePickupKey(state);

  // Each hole rolls its pickups the first time it is shown.
  useEffect(() => {
    if (state.phase === 'run') setState(s => withHolePickups(s));
  }, [state.phase, holePickupKey]);
  const autoSwingIntervalMs = getAutoSwingIntervalMs(effectLevels);

  useEffect(() => {
    if (state.phase !== 'run' || !state.autoSwingEnabled || !autoSwingIntervalMs) return undefined;
    // Count swings by the clock: background tabs throttle timers, so one late
    // tick plays every swing that came due while the tab was hidden.
    let lastSwingAt = Date.now();
    const intervalId = window.setInterval(() => {
      const due = Math.floor((Date.now() - lastSwingAt + 50) / autoSwingIntervalMs);
      if (due < 1) return;
      lastSwingAt += due * autoSwingIntervalMs;
      setState(s => (due === 1
        ? advanceSwingState(s, 'auto')
        : playAutoSwings(s, due * autoSwingIntervalMs).state));
    }, autoSwingIntervalMs);
    return () => window.clearInterval(intervalId);
  }, [state.phase, state.autoSwingEnabled, autoSwingIntervalMs]);

  const lastManualSwingAt = useRef(0);

  function handleSwing() {
    const now = Date.now();
    if (now - lastManualSwingAt.current < MANUAL_SWING_COOLDOWN_MS) return;
    lastManualSwingAt.current = now;
    setState(s => advanceSwingState(s, 'manual'));
  }

  function handleToggleAutoSwing() {
    setState(s => ({
      ...s,
      autoSwingEnabled: !s.autoSwingEnabled,
    }));
  }

  function handleEquipBall(ballId) {
    setState(s => (isBallUnlocked(ballId, s) ? { ...s, equippedBall: ballId } : s));
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
      const hadAutoSwing = Boolean(getAutoSwingIntervalMs(getEffectLevels(s)));
      const hasAutoSwing = Boolean(getAutoSwingIntervalMs(getEffectLevels({ ...s, upgrades: upgradeState })));
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

  function handleSelectCourse(courseId) {
    setState(s => {
      if (s.phase !== 'upgrade' || !isCourseUnlocked(courseId, getCourseUnlockContext(s))) return s;
      return {
        ...s,
        selectedCourseId: courseId,
      };
    });
  }

  function handleBuyProUpgrade(upgradeId) {
    setState(s => {
      const next = buyProUpgrade(s, upgradeId);
      const hadAutoSwing = Boolean(getAutoSwingIntervalMs(getEffectLevels(s)));
      const hasAutoSwing = Boolean(getAutoSwingIntervalMs(getEffectLevels(next)));
      return hasAutoSwing && !hadAutoSwing ? { ...next, autoSwingEnabled: true } : next;
    });
  }

  function handleTurnPro() {
    setView('clubhouse');
    setState(s => applyAchievementUnlocks(applyTurnPro(s)));
  }

  function handleStartNextRound() {
    if (state.roundResult === 'complete' && !state.nextCoursePerk) return;

    setView('course');
    setState(s => (s.roundResult === 'complete' && !s.nextCoursePerk ? s : startNextRoundState(s)));
  }

  const [confirmingReset, setConfirmingReset] = useState(false);

  function handleReset() {
    setConfirmingReset(false);
    clearSave();
    setView('course');
    setOverlay(null);
    setState(createInitialState());
  }

  const tourOfficeOpen = canTurnPro(state)
    || state.prestige.count > 0
    || PRO_CHAIN_COURSE_IDS.some(courseId => state.completedCourseIds.includes(courseId));

  return (
    <div className="app">
      <header className="app-header">
        <h1>Golf</h1>
        <p className="app-goal">Clear the tour, turn pro, open harder courses.</p>
      </header>

      <main key={view} className="view-enter">
        {view === 'course' && state.phase === 'run' && (
          <HoleScreen
            state={state}
            onSwing={handleSwing}
            onSelectSwingMode={handleSelectSwingMode}
            onToggleAutoSwing={handleToggleAutoSwing}
            onOpenOverlay={setOverlay}
            onOpenClubhouse={() => setView('clubhouse')}
            yardsPerSwing={getShotExpectedYards(state)}
            autoSwingIntervalMs={autoSwingIntervalMs}
            focusReady={FOCUS_READY}
          />
        )}

        {(view === 'clubhouse' || state.phase !== 'run') && (
          <Clubhouse
            state={state}
            door={door}
            onOpenDoor={setDoor}
            showTourOffice={tourOfficeOpen}
            onBackToCourse={() => setView('course')}
            onAllocate={handleAllocate}
            onChooseCoursePerk={handleChooseCoursePerk}
            onSelectCourse={handleSelectCourse}
            onStartNextRound={handleStartNextRound}
            onEquipBall={handleEquipBall}
            onTurnPro={handleTurnPro}
            onBuyProUpgrade={handleBuyProUpgrade}
            onOpenGuide={() => setOverlay('guide')}
          />
        )}
      </main>

      {overlay === 'scorecard' && (
        <Overlay title="Scorecard" onClose={() => setOverlay(null)}>
          <ScorecardPanel state={state} />
        </Overlay>
      )}
      {overlay === 'bag' && (
        <Overlay title="Ball Bag" onClose={() => setOverlay(null)}>
          <BallBagPanel state={state} onEquipBall={handleEquipBall} />
        </Overlay>
      )}
      {awayReport && (
        <Overlay title="While you were away" onClose={() => setAwayReport(null)}>
          <div className="away-report">
            <h2>While you were away</h2>
            <p>
              Your Auto Caddie played for {formatDuration(awayReport.awayMs)}: {awayReport.swings.toLocaleString()} swings,
              {' '}{awayReport.holes.toLocaleString()} holes and {awayReport.rounds.toLocaleString()} finished rounds.
            </p>
            <p className="big-number">+{awayReport.yards.toLocaleString()} yds banked</p>
            <p className="hint">Offline play is capped at 8 hours. Spend the yards in the Pro Shop.</p>
          </div>
        </Overlay>
      )}
      {overlay === 'guide' && (
        <Overlay title="How to Play" onClose={() => setOverlay(null)}>
          <GuidePanel />
        </Overlay>
      )}

      {confirmingReset ? (
        <div className="reset-confirm" role="alertdialog" aria-label="Confirm reset">
          <p>Erase everything, including Pro upgrades, records and achievements?</p>
          <button className="reset-btn danger" onClick={handleReset}>Erase save</button>
          <button className="reset-btn" onClick={() => setConfirmingReset(false)} autoFocus>Keep playing</button>
        </div>
      ) : (
        <button className="reset-btn" onClick={() => setConfirmingReset(true)}>
          Reset Game
        </button>
      )}
    </div>
  );
}
