import { getHoleDefinition, getHoleHazards } from '../data/courses.js';
import { getCoursePerkDistanceMultiplier } from '../data/coursePerks.js';
import { getSwingMode } from '../data/swingModes.js';
import {
  getApproachEntryRemaining,
  getApproachRange,
  getRemainingDistance,
  isApproachDistance,
  resolveApproachShot,
} from './approachLogic.js';
import {
  getApproachControlStats,
  getEffectLevels,
  getExpectedYardsPerSwing,
  getPuttingBonus,
  rollSwingYards,
} from './swingLogic.js';

export const SAND_DISTANCE_MULTIPLIER = 0.7;
const LAY_UP_GAP = 8;
const WATER_DROP_GAP = 5;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function getLieMultiplier(lie) {
  return lie === 'sand' ? SAND_DISTANCE_MULTIPLIER : 1;
}

// Expected full-swing distance for the ball's current spot, before variance.
export function getShotExpectedYards(s, swingModeId = s.selectedSwingMode) {
  return getExpectedYardsPerSwing(
    getEffectLevels(s),
    s.wind,
    getHoleDefinition(s.courseId, s.hole),
    getCoursePerkDistanceMultiplier(s.activeCoursePerk) * getLieMultiplier(s.lie),
    swingModeId
  );
}

export function getCurrentApproachRange(s) {
  return getApproachRange(getShotExpectedYards(s));
}

// Hazards only come into play once a swing can carry them; shorter hitters
// play around. Keeps the early game from stalling in front of a creek.
export function getActiveHazards(s, expectedYards) {
  return getHoleHazards(s.courseId, s.hole, s.targetDistance)
    .filter(hazard => expectedYards >= (hazard.end - hazard.start) * 1.5);
}

// The first hazard still ahead of the ball, if any.
export function getNextHazard(hazards, position) {
  return hazards
    .filter(hazard => hazard.end > position)
    .sort((a, b) => a.start - b.start)[0] || null;
}

// Putting odds from approach proximity (yards). Holing the approach needs no putt.
export function getPuttingOdds(proximity, { swingModeId = 'normal', bonus = 0 } = {}) {
  const swingMode = getSwingMode(swingModeId);
  const onePutt = clamp(0.92 - 0.06 * proximity + swingMode.onePuttBonus + bonus, 0.05, 0.97);
  const threePutt = clamp((0.012 * (proximity - 8) - bonus / 2) * swingMode.threePuttScale, 0, 0.35);
  return { onePutt, threePutt: Math.min(threePutt, 1 - onePutt) };
}

export function rollPutts(proximity, options = {}, rng = Math.random) {
  if (proximity <= 0) return 0;
  const { onePutt, threePutt } = getPuttingOdds(proximity, options);
  const roll = rng();
  if (roll < onePutt) return 1;
  if (roll < onePutt + threePutt) return 3;
  return 2;
}

/**
 * Resolve one swing on the current hole. Pure: returns what changed, and
 * App.jsx folds it into round state.
 *
 *   strokes   : swing + putts + penalty strokes added to the score
 *   ballsUsed : balls spent (the swing, plus one lost to water)
 */
export function playShot(s, { source = 'manual', focused = false, rng = Math.random } = {}) {
  const holeDefinition = getHoleDefinition(s.courseId, s.hole);
  const swingMode = getSwingMode(s.selectedSwingMode);
  const effectLevels = getEffectLevels(s);
  const lieMultiplier = getLieMultiplier(s.lie);
  const swing = rollSwingYards(effectLevels, s.wind, holeDefinition, {
    focused,
    source,
    distanceMultiplier: getCoursePerkDistanceMultiplier(s.activeCoursePerk) * lieMultiplier,
    swingMode: swingMode.id,
  });
  const remainingBefore = getRemainingDistance(s.targetDistance, s.yardsThisHole);
  const approachRange = getApproachRange(swing.expectedYards);
  const lieNote = s.lie === 'sand' ? 'From the sand' : null;

  if (isApproachDistance(remainingBefore, approachRange)) {
    const approach = resolveApproachShot({
      remaining: remainingBefore,
      swing,
      swingModeId: swingMode.id,
      approachStats: getApproachControlStats(effectLevels, source),
      focused,
      rng,
    });
    let putts = 0;
    if (approach.cleared) {
      putts = rollPutts(approach.proximity, {
        swingModeId: swingMode.id,
        bonus: getPuttingBonus(effectLevels) + (focused ? 0.1 : 0),
      }, rng);
    }
    return {
      swing: {
        ...swing,
        yards: approach.carry,
        shotPhase: 'approach',
        approach,
        putting: approach.cleared ? { putts, proximity: approach.proximity } : null,
        lieNote,
      },
      yardsThisHole: approach.cleared ? s.targetDistance : s.targetDistance - approach.nextRemaining,
      strokes: 1 + putts,
      ballsUsed: 1,
      holeCleared: approach.cleared,
      lie: 'fairway',
    };
  }

  const hazards = getActiveHazards(s, swing.expectedYards);
  let carry = swing.yards;
  let laidUp = false;
  if (swingMode.laysUp) {
    const hazard = getNextHazard(hazards, s.yardsThisHole);
    const stopAt = hazard ? hazard.start - LAY_UP_GAP - s.yardsThisHole : Infinity;
    if (hazard && stopAt > 0 && carry > stopAt) {
      carry = Math.round(stopAt);
      laidUp = true;
    }
  }

  let landing = s.yardsThisHole + carry;
  const result = {
    swing: { ...swing, yards: carry, shotPhase: 'fairway', laidUp, lieNote },
    strokes: 1,
    ballsUsed: 1,
    holeCleared: false,
    lie: 'fairway',
  };

  const hitHazard = hazards.find(hazard => landing >= hazard.start && landing <= hazard.end);
  if (hitHazard?.type === 'water') {
    const drop = Math.max(s.yardsThisHole, hitHazard.start - WATER_DROP_GAP);
    result.swing.hazard = {
      ...hitHazard,
      description: `In the ${hitHazard.name}. +1 stroke and a lost ball; dropped at ${drop} yds.`,
    };
    result.strokes += 1;
    result.ballsUsed += 1;
    result.yardsThisHole = drop;
    return result;
  }
  if (hitHazard?.type === 'bunker') {
    result.lie = 'sand';
    result.swing.hazard = {
      ...hitHazard,
      description: `In the ${hitHazard.name}. Next shot plays ${Math.round((1 - SAND_DISTANCE_MULTIPLIER) * 100)}% shorter.`,
    };
  }

  if (landing >= s.targetDistance - approachRange) {
    const nextRemaining = getApproachEntryRemaining(remainingBefore, carry, approachRange);
    landing = s.targetDistance - nextRemaining;
    result.swing.approach = {
      label: 'Approach Range',
      description: `Set up a ${nextRemaining} yd approach.`,
      carry,
      miss: null,
      nextRemaining,
      cleared: false,
      grade: 'setup',
    };
  }

  result.yardsThisHole = landing;
  return result;
}
