import { BASE_YARDS_PER_SWING, BASE_STARTING_BALLS } from './gameState.js';
import { UPGRADES } from '../data/upgrades.js';

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

// Starting balls: base + Σ addBalls × level
export function getStartingBalls(upgrades) {
  let balls = BASE_STARTING_BALLS;
  forEachActiveEffect(upgrades, (e, level) => {
    if (e.type === 'addBalls') balls += e.value * level;
  });
  return balls;
}
