import { COURSES, PRO_CHAIN_COURSE_IDS, getCourseById } from '../data/courses.js';
import { getProUpgradeById, getProUpgradeCost } from '../data/proUpgrades.js';
import {
  createInitialState,
  createScorecard,
  getCourseParTotal,
  yardsForHole,
} from './gameState.js';
import { getEffectLevels, getSigningBonusShare, getStartingBalls } from './swingLogic.js';

// Pro Points for one course = prestigeValue × (1 + 5% per stroke under par), clamped.
// Even par pays the course value; 10 under pays 1.5×, 10 over pays 0.5×.
export const POINTS_PER_STROKE = 0.05;
export const MIN_SHOT_EFFICIENCY = 0.25;
export const MAX_SHOT_EFFICIENCY = 3;

export function getShotEfficiency(courseId, shots) {
  if (!Number.isFinite(shots) || shots <= 0) return 0;
  const strokesUnderPar = getCourseParTotal(courseId) - shots;
  return Math.max(
    MIN_SHOT_EFFICIENCY,
    Math.min(MAX_SHOT_EFFICIENCY, 1 + strokesUnderPar * POINTS_PER_STROKE)
  );
}

export function getCoursePrestigePoints(courseId, shots) {
  const course = getCourseById(courseId);
  if (!Number.isFinite(shots)) return 0;
  return Math.max(1, Math.floor((course.prestigeValue ?? 1) * getShotEfficiency(courseId, shots)));
}

export function getPrestigeBreakdown(state) {
  return COURSES
    .filter(course => state.cycleBestRounds[course.id])
    .map(course => {
      const round = state.cycleBestRounds[course.id];
      return {
        courseId: course.id,
        name: course.name,
        shots: round.shots,
        par: getCourseParTotal(course.id),
        points: getCoursePrestigePoints(course.id, round.shots),
      };
    });
}

export function getPendingPrestigePoints(state) {
  return getPrestigeBreakdown(state).reduce((total, entry) => total + entry.points, 0);
}

export function getMissingProChainCourses(state) {
  return PRO_CHAIN_COURSE_IDS.filter(courseId => !state.completedCourseIds.includes(courseId));
}

export function canTurnPro(state) {
  return getMissingProChainCourses(state).length === 0;
}

export function getSigningBonusYards(state) {
  return Math.floor((state.cycleYardsEarned ?? 0) * getSigningBonusShare(getEffectLevels(state)));
}

// Prestige: bank Pro Points, wipe Tier 1 and the current cycle, keep Tier 2,
// lifetime stats, achievements, and all-time course records. The player lands in
// the Clubhouse with a signing bonus to spend, so a Course Pass bought right
// after turning pro can be picked for the very first round.
export function applyTurnPro(state) {
  if (!canTurnPro(state)) return state;

  const earned = getPendingPrestigePoints(state);
  const signingBonus = getSigningBonusYards(state);
  const fresh = createInitialState();
  const prestige = {
    ...state.prestige,
    points: state.prestige.points + earned,
    totalEarned: state.prestige.totalEarned + earned,
    count: state.prestige.count + 1,
  };
  const startingCourseId = COURSES[0].id;

  return {
    ...fresh,
    prestige,
    courseRecords: state.courseRecords,
    bestCompletedRound: state.bestCompletedRound,
    roundsCompleted: state.roundsCompleted,
    lifetimeStats: state.lifetimeStats,
    achievements: state.achievements,
    autoSwingEnabled: state.autoSwingEnabled,
    selectedSwingMode: state.selectedSwingMode,
    courseId: startingCourseId,
    selectedCourseId: startingCourseId,
    targetDistance: yardsForHole(1, startingCourseId),
    scorecard: createScorecard(startingCourseId),
    ballsLeft: getStartingBalls(getEffectLevels({ ...fresh, prestige })),
    phase: 'upgrade',
    roundResult: null,
    yardsToAllocate: signingBonus,
    lastProResult: { earned, count: prestige.count, signingBonus },
    equippedBall: state.equippedBall,
  };
}

export function buyProUpgrade(state, upgradeId) {
  const def = getProUpgradeById(upgradeId);
  if (!def) return state;
  const level = state.prestige.upgrades[upgradeId]?.level ?? 0;
  const cost = getProUpgradeCost(def, level);
  if (!Number.isFinite(cost) || state.prestige.points < cost) return state;

  return {
    ...state,
    prestige: {
      ...state.prestige,
      points: state.prestige.points - cost,
      upgrades: {
        ...state.prestige.upgrades,
        [upgradeId]: { level: level + 1 },
      },
    },
  };
}
