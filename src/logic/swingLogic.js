import { BASE_YARDS_PER_SWING, BASE_STARTING_BALLS } from './gameState.js';
import { UPGRADES } from '../data/upgrades.js';
import { rollShotEvent } from '../data/shotEvents.js';
import { getSwingMode } from '../data/swingModes.js';
import { normalizeWind } from './runModifiers.js';

// Iterate every upgrade definition and apply its effects scaled by current level.
// Additive effects scale linearly with level; multipliers scale exponentially.
function forEachActiveEffect(upgrades, fn) {
  for (const def of UPGRADES) {
    const level = upgrades[def.id]?.level ?? 0;
    if (level <= 0) continue;
    for (const e of def.effects) fn(e, level);
  }
}

// Yards per swing: (base + Σ addYards × level) × Π (multYards ^ level)
export function getYardsPerSwing(upgrades) {
  let yards = BASE_YARDS_PER_SWING;
  let mult = 1;
  forEachActiveEffect(upgrades, (e, level) => {
    if (e.type === 'addYards') yards += e.value * level;
    else if (e.type === 'multYards') mult *= Math.pow(e.value, level);
  });
  return Math.round(yards * mult);
}

export function getExpectedYardsPerSwing(
  upgrades,
  wind,
  holeDefinition = null,
  distanceMultiplier = 1,
  swingModeId = 'normal'
) {
  const holeMultiplier = holeDefinition?.trait?.distanceMultiplier ?? 1;
  const swingMode = getSwingMode(swingModeId);
  return Math.max(1, Math.round(
    getYardsPerSwing(upgrades)
      * normalizeWind(wind).multiplier
      * holeMultiplier
      * distanceMultiplier
      * swingMode.distanceMultiplier
  ));
}

export function rollSwingYards(upgrades, wind, holeDefinition = null, options = {}) {
  const swingMode = getSwingMode(options.swingMode);
  const expectedYards = getExpectedYardsPerSwing(
    upgrades,
    wind,
    holeDefinition,
    options.distanceMultiplier ?? 1,
    swingMode.id
  );
  const focused = Boolean(options.focused);
  const perfect = !focused && Math.random() < swingMode.perfectChance;
  const event = rollShotEvent();
  const variance = perfect
    ? swingMode.perfectMultiplier
    : swingMode.varianceMin + Math.random() * (swingMode.varianceMax - swingMode.varianceMin);
  const eventMultiplier = event?.multiplier ?? 1;
  const yards = Math.max(1, Math.round(expectedYards * (focused ? 1.5 : variance) * eventMultiplier));

  let quality = 'Steady';
  if (focused) quality = 'Focused';
  else if (perfect) quality = 'Perfect';
  else if (variance >= 1.04) quality = 'Clean';
  else if (variance <= 0.96) quality = 'Soft';

  return {
    yards,
    expectedYards,
    quality,
    source: options.source || 'manual',
    swingMode: swingMode.id,
    event,
  };
}

// Starting balls: base + Σ addBalls × level
export function getStartingBalls(upgrades) {
  let balls = BASE_STARTING_BALLS;
  forEachActiveEffect(upgrades, (e, level) => {
    if (e.type === 'addBalls') balls += e.value * level;
  });
  return balls;
}

export function getAutoSwingLevel(upgrades) {
  let autoLevel = 0;
  forEachActiveEffect(upgrades, (e, level) => {
    if (e.type === 'autoSwing') autoLevel += e.value * level;
  });
  return autoLevel;
}

export function getAutoSwingIntervalMs(upgrades) {
  const autoLevel = getAutoSwingLevel(upgrades);
  if (autoLevel <= 0) return null;
  return Math.max(900, Math.round(5000 * Math.pow(0.78, autoLevel - 1)));
}

export function formatAutoSwingInterval(intervalMs) {
  if (!intervalMs) return 'Locked';
  return `${(intervalMs / 1000).toFixed(1)}s`;
}
