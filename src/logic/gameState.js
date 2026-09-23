import { UPGRADES } from '../data/upgrades.js';
import { COURSES, getCourseById } from '../data/courses.js';
import { normalizeWind, rollWind } from './runModifiers.js';

export const SAVE_VERSION = 6;

export const BASE_YARDS_PER_SWING = 25;
export const BASE_STARTING_BALLS = 10;
export const HOLES_PER_ROUND = 18;

// Yardage target for a given hole (1-indexed).
export function yardsForHole(hole) {
  return 300 + (hole - 1) * 50;
}

export function parForHole(hole) {
  const yards = yardsForHole(hole);
  if (yards < 400) return 4;
  if (yards < 600) return 5;
  if (yards < 850) return 6;
  return 7;
}

function buildInitialUpgrades() {
  const upgrades = {};
  for (const u of UPGRADES) {
    upgrades[u.id] = { level: 0, progress: 0 };
  }
  return upgrades;
}

export function createScorecard() {
  return Array.from({ length: HOLES_PER_ROUND }, (_, index) => {
    const hole = index + 1;
    return {
      hole,
      targetDistance: yardsForHole(hole),
      par: parForHole(hole),
      shots: null,
      scoreToPar: null,
    };
  });
}

export function createInitialState() {
  return {
    version: SAVE_VERSION,
    phase: 'run',                  // 'run' | 'upgrade'
    courseId: COURSES[0].id,
    hole: 1,
    targetDistance: yardsForHole(1),
    yardsThisHole: 0,              // resets each hole
    currentHoleShots: 0,
    ballsLeft: BASE_STARTING_BALLS,
    totalShots: 0,                 // shots taken this round (for prestige later)
    totalYardsThisRound: 0,        // sum of yards hit this round (upgrade currency)
    yardsToAllocate: 0,            // yards available to spend in upgrade phase
    upgrades: buildInitialUpgrades(),
    wind: rollWind(),
    lastSwing: null,
    autoSwingEnabled: true,
    scorecard: createScorecard(),
    roundsCompleted: 0,
    bestCompletedRound: null,
    roundResult: null,             // 'complete' (all 18) | 'outOfBalls' | null
  };
}

function normalizeUpgradeState(upgrades = {}) {
  const initial = buildInitialUpgrades();
  for (const upgrade of UPGRADES) {
    initial[upgrade.id] = {
      ...initial[upgrade.id],
      ...(upgrades[upgrade.id] || {}),
    };
  }
  return initial;
}

function normalizeScorecard(scorecard) {
  const initial = createScorecard();
  if (!Array.isArray(scorecard)) return initial;

  return initial.map((entry, index) => {
    const saved = scorecard[index] || {};
    const shots = Number.isFinite(saved.shots) ? saved.shots : null;
    return {
      ...entry,
      shots,
      scoreToPar: shots === null ? null : shots - entry.par,
    };
  });
}

export function normalizeState(state) {
  const initial = createInitialState();
  const normalizedHole = Math.min(
    HOLES_PER_ROUND,
    Math.max(1, Number.isFinite(state?.hole) ? state.hole : initial.hole)
  );

  return {
    ...initial,
    ...state,
    version: SAVE_VERSION,
    courseId: getCourseById(state?.courseId).id,
    hole: normalizedHole,
    targetDistance: Number.isFinite(state?.targetDistance)
      ? state.targetDistance
      : yardsForHole(normalizedHole),
    currentHoleShots: Number.isFinite(state?.currentHoleShots) ? state.currentHoleShots : 0,
    upgrades: normalizeUpgradeState(state?.upgrades),
    wind: normalizeWind(state?.wind),
    lastSwing: state?.lastSwing || null,
    autoSwingEnabled: typeof state?.autoSwingEnabled === 'boolean' ? state.autoSwingEnabled : true,
    scorecard: normalizeScorecard(state?.scorecard),
    roundsCompleted: Number.isFinite(state?.roundsCompleted) ? state.roundsCompleted : 0,
    bestCompletedRound: state?.bestCompletedRound || null,
  };
}

export function recordHoleScore(scorecard, hole, shots) {
  return normalizeScorecard(scorecard).map(entry => {
    if (entry.hole !== hole) return entry;
    return {
      ...entry,
      shots,
      scoreToPar: shots - entry.par,
    };
  });
}

export function getCompletedHoles(scorecard = []) {
  return scorecard.filter(entry => Number.isFinite(entry.shots));
}

export function getScoreToPar(scorecard = []) {
  return getCompletedHoles(scorecard).reduce((total, entry) => total + entry.scoreToPar, 0);
}

export function formatScoreToPar(scoreToPar) {
  if (scoreToPar === 0) return 'E';
  return scoreToPar > 0 ? `+${scoreToPar}` : `${scoreToPar}`;
}

export function summarizeCompletedRound(scorecard, totalShots, totalYards) {
  return {
    shots: totalShots,
    scoreToPar: getScoreToPar(scorecard),
    totalYards,
  };
}

export function isBetterCompletedRound(candidate, best) {
  if (!best) return true;
  if (candidate.scoreToPar !== best.scoreToPar) {
    return candidate.scoreToPar < best.scoreToPar;
  }
  return candidate.shots < best.shots;
}
