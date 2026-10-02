import { UPGRADES } from '../data/upgrades.js';
import {
  COURSES,
  getCourseById,
  getNextCourseId,
  isCourseUnlocked,
  isValidCourseId,
} from '../data/courses.js';
import { PRO_UPGRADES } from '../data/proUpgrades.js';
import { createCoursePerkChoices, getCoursePerkById } from '../data/coursePerks.js';
import { getSwingMode } from '../data/swingModes.js';
import { normalizeWind, rollWind } from './runModifiers.js';

export const SAVE_VERSION = 12;

export const BASE_YARDS_PER_SWING = 25;
export const BASE_STARTING_BALLS = 10;
export const HOLES_PER_ROUND = 18;

// Yardage target for a given hole (1-indexed).
export function yardsForHole(hole, courseId = COURSES[0].id) {
  const course = getCourseById(courseId);
  return (course.targetBase ?? 300) + (hole - 1) * (course.targetStep ?? 50);
}

// Par = full swings to reach the green at the course's design power, plus two putts.
export function parForHole(hole, courseId = COURSES[0].id) {
  const course = getCourseById(courseId);
  const swingsToGreen = Math.ceil(yardsForHole(hole, courseId) / (course.designYards ?? 260));
  return Math.max(3, Math.min(5, swingsToGreen + 2));
}

function buildInitialUpgrades() {
  const upgrades = {};
  for (const u of UPGRADES) {
    upgrades[u.id] = { level: 0, progress: 0 };
  }
  return upgrades;
}

function buildInitialProUpgrades() {
  const upgrades = {};
  for (const u of PRO_UPGRADES) {
    upgrades[u.id] = { level: 0 };
  }
  return upgrades;
}

export function createPrestigeState() {
  return {
    points: 0,                     // unspent Pro Points
    totalEarned: 0,                // lifetime Pro Points
    count: 0,                      // times turned pro
    upgrades: buildInitialProUpgrades(),
  };
}

function createLifetimeStats() {
  return {
    swings: 0,
    manualSwings: 0,
    autoSwings: 0,
    focusedSwings: 0,
    perfectSwings: 0,
    yards: 0,
    holesCleared: 0,
    coursesCompleted: 0,
    bestSwing: 0,
    achievementYards: 0,
    putts: 0,
    onePutts: 0,
    holeOuts: 0,
    waterBalls: 0,
  };
}

export function createScorecard(courseId = COURSES[0].id) {
  return Array.from({ length: HOLES_PER_ROUND }, (_, index) => {
    const hole = index + 1;
    return {
      hole,
      targetDistance: yardsForHole(hole, courseId),
      par: parForHole(hole, courseId),
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
    lie: 'fairway',                // 'fairway' | 'sand'
    currentHoleShots: 0,
    ballsLeft: BASE_STARTING_BALLS,
    totalShots: 0,                 // shots taken this round (for prestige later)
    totalYardsThisRound: 0,        // sum of yards hit this round (upgrade currency)
    yardsToAllocate: 0,            // yards available to spend in upgrade phase
    upgrades: buildInitialUpgrades(),
    wind: rollWind(),
    lastSwing: null,
    autoSwingEnabled: true,
    selectedSwingMode: 'normal',
    focusMeter: 0,
    activeCoursePerk: null,
    pendingCoursePerkChoices: [],
    nextCoursePerk: null,
    completedCourseIds: [],        // completed in the current pro cycle
    selectedCourseId: COURSES[0].id, // course the next round starts on
    cycleBestRounds: {},           // courseId -> best round this pro cycle (prestige scoring)
    courseRecords: {},             // courseId -> all-time best round
    prestige: createPrestigeState(),
    lastProResult: null,           // { earned, count } after the most recent prestige
    lifetimeStats: createLifetimeStats(),
    achievements: {},
    recentAchievements: [],
    scorecard: createScorecard(COURSES[0].id),
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

function normalizeScorecard(scorecard, courseId = COURSES[0].id) {
  const initial = createScorecard(courseId);
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

function normalizeProUpgradeState(upgrades = {}) {
  const initial = buildInitialProUpgrades();
  for (const upgrade of PRO_UPGRADES) {
    const level = upgrades?.[upgrade.id]?.level;
    initial[upgrade.id] = {
      level: Number.isFinite(level) ? Math.max(0, Math.min(upgrade.maxLevel, level)) : 0,
    };
  }
  return initial;
}

function normalizePrestigeState(prestige = {}) {
  const initial = createPrestigeState();
  return {
    points: Number.isFinite(prestige?.points) ? Math.max(0, prestige.points) : initial.points,
    totalEarned: Number.isFinite(prestige?.totalEarned) ? prestige.totalEarned : initial.totalEarned,
    count: Number.isFinite(prestige?.count) ? prestige.count : initial.count,
    upgrades: normalizeProUpgradeState(prestige?.upgrades),
  };
}

function normalizeRoundRecords(records) {
  if (!records || typeof records !== 'object') return {};
  const normalized = {};
  for (const [courseId, record] of Object.entries(records)) {
    if (!isValidCourseId(courseId) || !Number.isFinite(record?.shots)) continue;
    normalized[courseId] = {
      shots: record.shots,
      scoreToPar: Number.isFinite(record.scoreToPar) ? record.scoreToPar : 0,
      ...(record.migrated ? { migrated: true } : {}),
    };
  }
  return normalized;
}

export function getCourseParTotal(courseId) {
  return createScorecard(courseId).reduce((total, entry) => total + entry.par, 0);
}

// v11 saves waiting on the upgrade screen after a completed course used to
// advance along the course chain, so keep that destination.
function getMigratedSelectedCourseId(state, completedCourseIds) {
  const courseId = getCourseById(state?.courseId).id;
  if (state?.phase !== 'upgrade' || state?.roundResult !== 'complete') return courseId;
  const nextCourseId = getNextCourseId(courseId);
  return nextCourseId && isCourseUnlocked(nextCourseId, { completedCourseIds })
    ? nextCourseId
    : courseId;
}

// v11 -> v12: prestige, course select, and per-course records.
// v11 saves only know which courses were completed, not how well, so each completed
// course is seeded with an even-par round. That keeps an earned prestige available.
function migrateV11ToV12(state) {
  const completedCourseIds = Array.isArray(state?.completedCourseIds)
    ? state.completedCourseIds.filter(isValidCourseId)
    : [];
  const seededRounds = {};
  for (const courseId of completedCourseIds) {
    seededRounds[courseId] = { shots: getCourseParTotal(courseId), scoreToPar: 0, migrated: true };
  }
  return {
    ...state,
    selectedCourseId: getMigratedSelectedCourseId(state, completedCourseIds),
    cycleBestRounds: seededRounds,
    courseRecords: seededRounds,
    prestige: createPrestigeState(),
  };
}

export function migrateState(state) {
  let migrated = state;
  if ((migrated?.version ?? 0) < 12) migrated = migrateV11ToV12(migrated);
  return migrated;
}

function normalizeLifetimeStats(lifetimeStats = {}) {
  return {
    ...createLifetimeStats(),
    ...lifetimeStats,
  };
}

function normalizeCoursePerk(perkId) {
  return getCoursePerkById(perkId)?.id || null;
}

function normalizeCoursePerkChoices(choices = []) {
  if (!Array.isArray(choices)) return [];
  return choices.filter(choice => getCoursePerkById(choice));
}

export function normalizeState(savedState) {
  const state = migrateState(savedState);
  const initial = createInitialState();
  const normalizedCourseId = getCourseById(state?.courseId).id;
  const normalizedNextCoursePerk = normalizeCoursePerk(state?.nextCoursePerk);
  const normalizedCoursePerkChoices = normalizeCoursePerkChoices(state?.pendingCoursePerkChoices);
  const needsMigratedPerkChoices = state?.phase === 'upgrade'
    && state?.roundResult === 'complete'
    && !normalizedNextCoursePerk
    && normalizedCoursePerkChoices.length === 0;
  const normalizedHole = Math.min(
    HOLES_PER_ROUND,
    Math.max(1, Number.isFinite(state?.hole) ? state.hole : initial.hole)
  );

  return {
    ...initial,
    ...state,
    version: SAVE_VERSION,
    courseId: normalizedCourseId,
    hole: normalizedHole,
    targetDistance: Number.isFinite(state?.targetDistance)
      ? state.targetDistance
      : yardsForHole(normalizedHole, normalizedCourseId),
    currentHoleShots: Number.isFinite(state?.currentHoleShots) ? state.currentHoleShots : 0,
    lie: state?.lie === 'sand' ? 'sand' : 'fairway',
    upgrades: normalizeUpgradeState(state?.upgrades),
    wind: normalizeWind(state?.wind),
    lastSwing: state?.lastSwing || null,
    autoSwingEnabled: typeof state?.autoSwingEnabled === 'boolean' ? state.autoSwingEnabled : true,
    selectedSwingMode: getSwingMode(state?.selectedSwingMode).id,
    focusMeter: Number.isFinite(state?.focusMeter) ? state.focusMeter : 0,
    activeCoursePerk: normalizeCoursePerk(state?.activeCoursePerk),
    pendingCoursePerkChoices: needsMigratedPerkChoices
      ? createCoursePerkChoices()
      : normalizedCoursePerkChoices,
    nextCoursePerk: normalizedNextCoursePerk,
    completedCourseIds: Array.isArray(state?.completedCourseIds)
      ? state.completedCourseIds.filter(courseId => getCourseById(courseId).id === courseId)
      : [],
    selectedCourseId: isValidCourseId(state?.selectedCourseId) ? state.selectedCourseId : normalizedCourseId,
    cycleBestRounds: normalizeRoundRecords(state?.cycleBestRounds),
    courseRecords: normalizeRoundRecords(state?.courseRecords),
    prestige: normalizePrestigeState(state?.prestige),
    lifetimeStats: normalizeLifetimeStats(state?.lifetimeStats),
    achievements: state?.achievements || {},
    recentAchievements: Array.isArray(state?.recentAchievements) ? state.recentAchievements : [],
    scorecard: normalizeScorecard(state?.scorecard, normalizedCourseId),
    roundsCompleted: Number.isFinite(state?.roundsCompleted) ? state.roundsCompleted : 0,
    bestCompletedRound: state?.bestCompletedRound || null,
  };
}

export function recordHoleScore(scorecard, hole, shots, courseId = COURSES[0].id) {
  return normalizeScorecard(scorecard, courseId).map(entry => {
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

export function recordCourseRound(records, courseId, round) {
  if (!isBetterCompletedRound(round, records[courseId])) return records;
  return {
    ...records,
    [courseId]: { shots: round.shots, scoreToPar: round.scoreToPar },
  };
}

export function isBetterCompletedRound(candidate, best) {
  if (!best) return true;
  if (candidate.scoreToPar !== best.scoreToPar) {
    return candidate.scoreToPar < best.scoreToPar;
  }
  return candidate.shots < best.shots;
}
