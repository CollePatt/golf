import { UPGRADES } from '../data/upgrades.js';

export const SAVE_VERSION = 2;

export const BASE_YARDS_PER_SWING = 25;
export const BASE_STARTING_BALLS = 10;
export const HOLES_PER_ROUND = 18;

// Yardage target for a given hole (1-indexed).
export function yardsForHole(hole) {
  return 300 + (hole - 1) * 50;
}

function buildInitialUpgrades() {
  const upgrades = {};
  for (const u of UPGRADES) {
    upgrades[u.id] = { level: 0, progress: 0 };
  }
  return upgrades;
}

export function createInitialState() {
  return {
    version: SAVE_VERSION,
    phase: 'run',                  // 'run' | 'upgrade'
    hole: 1,
    targetDistance: yardsForHole(1),
    yardsThisHole: 0,              // resets each hole
    ballsLeft: BASE_STARTING_BALLS,
    totalShots: 0,                 // shots taken this round (for prestige later)
    totalYardsThisRound: 0,        // sum of yards hit this round (upgrade currency)
    yardsToAllocate: 0,            // yards available to spend in upgrade phase
    upgrades: buildInitialUpgrades(),
    roundResult: null,             // 'complete' (all 18) | 'outOfBalls' | null
  };
}
