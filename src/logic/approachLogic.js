import { getSwingMode } from '../data/swingModes.js';

export const APPROACH_DISTANCE = 120;
export const MIN_APPROACH_REMAINING = 35;
export const STUFFED_WINDOW = 6;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function getRemainingDistance(targetDistance, yardsThisHole) {
  return Math.max(0, targetDistance - yardsThisHole);
}

export function isApproachDistance(remaining) {
  return remaining > 0 && remaining <= APPROACH_DISTANCE;
}

export function getApproachEntryRemaining(remainingBefore, carryYards) {
  const missFromPin = remainingBefore - carryYards;
  const nextRemaining = missFromPin >= 0
    ? missFromPin
    : Math.abs(missFromPin) + MIN_APPROACH_REMAINING;

  return Math.round(clamp(nextRemaining, MIN_APPROACH_REMAINING, APPROACH_DISTANCE));
}

export function getApproachFinishWindow(swingModeId, focused = false) {
  const swingMode = getSwingMode(swingModeId);
  return Math.max(
    STUFFED_WINDOW,
    Math.round(swingMode.approachFinishWindow * (focused ? 1.35 : 1))
  );
}

export function resolveApproachShot({
  remaining,
  swing,
  swingModeId,
  focused = false,
  rng = Math.random,
}) {
  const swingMode = getSwingMode(swingModeId);
  const finishWindow = getApproachFinishWindow(swingMode.id, focused);
  const errorScale = focused ? 0.55 : 1;
  const powerShortfall = Math.max(0, remaining - swing.expectedYards);
  const errorRange = Math.max(
    STUFFED_WINDOW,
    (swingMode.approachErrorYards
      + remaining * swingMode.approachErrorRatio
      + powerShortfall * 0.25) * errorScale
  );
  const aimedCarry = remaining * swingMode.approachAim;
  const rawError = (rng() * 2 - 1) * errorRange;
  const carry = Math.max(1, Math.round(Math.min(swing.yards, aimedCarry + rawError)));
  const miss = carry - remaining;
  const absMiss = Math.abs(miss);

  if (absMiss <= STUFFED_WINDOW) {
    return {
      label: 'Stuffed It',
      description: `Landed within ${absMiss} yds of the pin.`,
      carry,
      miss,
      nextRemaining: 0,
      cleared: true,
      grade: 'great',
    };
  }

  if (absMiss <= finishWindow) {
    return {
      label: 'On The Green',
      description: `${absMiss} yds from the cup, close enough to finish.`,
      carry,
      miss,
      nextRemaining: 0,
      cleared: true,
      grade: 'good',
    };
  }

  const longMiss = miss > 0;
  const comeback = longMiss
    ? Math.round(absMiss * swingMode.approachLongPenalty)
    : absMiss;
  const badLie = longMiss && absMiss >= 30;
  const nextRemaining = Math.round(clamp(
    comeback + (badLie ? 10 : 0),
    STUFFED_WINDOW + 1,
    APPROACH_DISTANCE
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
