import { getSwingMode } from '../data/swingModes.js';

export const APPROACH_DISTANCE = 120;
export const MIN_APPROACH_REMAINING = 35;
export const STUFFED_WINDOW = 6;
// Share of the per-yard approach error applied beyond the base 120 yd zone.
// Scaled again by how hard the swing has to work, so extra power buys accuracy.
export const LONG_APPROACH_ERROR_SCALE = 0.55;
export const MIN_SWING_EFFORT = 0.4;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function getRemainingDistance(targetDistance, yardsThisHole) {
  return Math.max(0, targetDistance - yardsThisHole);
}

// Approach range grows with swing power: anything a full swing can reach is
// played as an approach at the pin instead of a fairway shot.
export function getApproachRange(expectedYards = 0) {
  return Math.max(APPROACH_DISTANCE, Math.round(expectedYards));
}

export function isApproachDistance(remaining, approachRange = APPROACH_DISTANCE) {
  return remaining > 0 && remaining <= approachRange;
}

export function getApproachEntryRemaining(remainingBefore, carryYards, approachRange = APPROACH_DISTANCE) {
  const missFromPin = remainingBefore - carryYards;
  const nextRemaining = missFromPin >= 0
    ? missFromPin
    : Math.abs(missFromPin) + MIN_APPROACH_REMAINING;

  return Math.round(clamp(nextRemaining, MIN_APPROACH_REMAINING, approachRange));
}

export function getApproachFinishWindow(swingModeId, focused = false, approachStats = {}) {
  const swingMode = getSwingMode(swingModeId);
  return Math.max(
    STUFFED_WINDOW,
    Math.round((swingMode.approachFinishWindow + (approachStats.finishWindowBonus ?? 0))
      * (focused ? 1.35 : 1))
  );
}

export function resolveApproachShot({
  remaining,
  swing,
  swingModeId,
  approachStats = {},
  focused = false,
  rng = Math.random,
}) {
  const swingMode = getSwingMode(swingModeId);
  const finishWindow = getApproachFinishWindow(swingMode.id, focused, approachStats);
  const errorScale = focused ? 0.55 : 1;
  const errorMultiplier = approachStats.errorMultiplier ?? 1;
  const powerShortfall = Math.max(0, remaining - swing.expectedYards);
  const nearYards = Math.min(remaining, APPROACH_DISTANCE);
  const longYards = Math.max(0, remaining - APPROACH_DISTANCE);
  const swingEffort = clamp(remaining / Math.max(1, swing.expectedYards), MIN_SWING_EFFORT, 1);
  const errorRange = Math.max(
    STUFFED_WINDOW,
    (swingMode.approachErrorYards
      + nearYards * swingMode.approachErrorRatio
      + longYards * swingMode.approachErrorRatio * LONG_APPROACH_ERROR_SCALE * swingEffort
      + powerShortfall * 0.25) * errorScale * errorMultiplier
  );
  const aimedCarry = remaining * swingMode.approachAim;
  const rawError = (rng() * 2 - 1) * errorRange;
  const carry = Math.max(1, Math.round(Math.min(swing.yards, aimedCarry + rawError)));
  const miss = carry - remaining;
  const absMiss = Math.abs(miss);

  if (absMiss <= STUFFED_WINDOW) {
    return {
      label: absMiss === 0 ? 'Holed It' : 'Stuffed It',
      description: absMiss === 0 ? 'Straight into the cup.' : `Landed within ${absMiss} yds of the pin.`,
      carry,
      miss,
      proximity: absMiss,
      nextRemaining: 0,
      cleared: true,
      grade: 'great',
    };
  }

  if (absMiss <= finishWindow) {
    return {
      label: 'On The Green',
      description: `${absMiss} yds from the cup.`,
      carry,
      miss,
      proximity: absMiss,
      nextRemaining: 0,
      cleared: true,
      grade: 'good',
    };
  }

  const longMiss = miss > 0;
  const comeback = longMiss
    ? Math.round(absMiss * swingMode.approachLongPenalty * (approachStats.longPenaltyMultiplier ?? 1))
    : absMiss;
  const badLie = longMiss && absMiss >= 30;
  const nextRemaining = Math.round(clamp(
    comeback + (badLie ? 10 : 0),
    STUFFED_WINDOW + 1,
    Math.max(APPROACH_DISTANCE, remaining)
  ));

  return {
    label: badLie ? 'Flew The Green' : longMiss ? 'Rolled Long' : 'Left Short',
    description: badLie
      ? `Missed long into trouble. ${nextRemaining} yds left.`
      : `${nextRemaining} yds left for the next approach.`,
    carry,
    miss,
    nextRemaining,
    cleared: false,
    grade: badLie ? 'bad' : 'miss',
  };
}
