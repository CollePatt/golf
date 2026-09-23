import { UPGRADES, getUpgradeCost } from '../data/upgrades.js';

/**
 * Pour as many remaining yards as possible into one upgrade.
 * Buys consecutive levels until either the yards run out, the upgrade
 * is maxed, or there are not enough yards for the next level. Partial
 * progress toward the next level is preserved.
 */
export function allocateToUpgrade(upgradeId, upgradeState, yardsToAllocate) {
  const def = UPGRADES.find(u => u.id === upgradeId);
  if (!def) return { upgradeState, yardsToAllocate };

  let { level, progress } = upgradeState[upgradeId];
  let remaining = yardsToAllocate;

  while (level < def.maxLevel && remaining > 0) {
    const cost = getUpgradeCost(def, level);
    const needed = cost - progress;
    const toAdd = Math.min(remaining, needed);
    progress += toAdd;
    remaining -= toAdd;
    if (progress >= cost) {
      level += 1;
      progress = 0;
    } else {
      break; // ran out of yards before completing this level
    }
  }

  // Maxed-out upgrades can't hold leftover progress.
  if (level >= def.maxLevel) progress = 0;

  return {
    upgradeState: {
      ...upgradeState,
      [upgradeId]: { level, progress },
    },
    yardsToAllocate: remaining,
  };
}
