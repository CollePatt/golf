import {
  COIN_HOLE_SHARE,
  MAGNET_RADIUS_MULT,
  PICKUPS,
  TAILWIND_MULTIPLIER,
  TAILWIND_SWINGS,
  getPickupById,
} from '../data/pickups.js';
import { getBallEffects } from '../data/balls.js';

// Pickups sit between 12% and 92% of the hole, so some land on the fairway
// and some near the pin where only a tight approach reaches them.
const MIN_SPOT = 0.12;
const MAX_SPOT = 0.92;
const MIN_GAP_SHARE = 0.1;
const BASE_RADIUS = 8;
const RADIUS_PER_SWING_YARD = 0.14;
const MAX_BASE_RADIUS = 36;

export function createBuffs() {
  return { tailwindSwings: 0, clover: false, magnet: false };
}

export function normalizeBuffs(buffs) {
  return {
    tailwindSwings: Number.isFinite(buffs?.tailwindSwings) ? Math.max(0, buffs.tailwindSwings) : 0,
    clover: Boolean(buffs?.clover),
    magnet: Boolean(buffs?.magnet),
  };
}

export function normalizeHolePickups(holePickups) {
  if (!holePickups || !Array.isArray(holePickups.items)) return null;
  const items = holePickups.items.filter(item => (
    getPickupById(item?.type) && Number.isFinite(item?.at)
  ));
  return { key: String(holePickups.key ?? ''), items };
}

export function getHolePickupKey(s) {
  return `${s.courseId}:${s.hole}:${s.targetDistance}`;
}

function pickWeighted(rng) {
  const total = PICKUPS.reduce((sum, pickup) => sum + pickup.weight, 0);
  let roll = rng() * total;
  for (const pickup of PICKUPS) {
    roll -= pickup.weight;
    if (roll < 0) return pickup.id;
  }
  return PICKUPS[0].id;
}

export function getPickupCount(targetDistance, extraPickups = 0) {
  return 1 + (targetDistance >= 450 ? 1 : 0) + (targetDistance >= 900 ? 1 : 0) + extraPickups;
}

export function rollHolePickups(s, rng = Math.random) {
  const count = getPickupCount(s.targetDistance, getBallEffects(s).extraPickups ?? 0);
  const minGap = s.targetDistance * MIN_GAP_SHARE;
  const spots = [];
  for (let attempt = 0; spots.length < count && attempt < count * 12; attempt += 1) {
    const at = Math.round(s.targetDistance * (MIN_SPOT + rng() * (MAX_SPOT - MIN_SPOT)));
    if (spots.every(spot => Math.abs(spot - at) >= minGap)) spots.push(at);
  }
  return {
    key: getHolePickupKey(s),
    items: spots
      .sort((a, b) => a - b)
      .map((at, index) => ({ id: index, type: pickWeighted(rng), at, collected: false })),
  };
}

// Rolls pickups for the current hole if it has none yet.
export function withHolePickups(s, rng = Math.random) {
  if (s.holePickups?.key === getHolePickupKey(s)) return s;
  return { ...s, holePickups: rollHolePickups(s, rng) };
}

// How close (yards) the ball must stop to a pickup to collect it. Grows with
// swing power so long hitters, who land less often, still find some.
export function getPickupRadius(s, expectedYards) {
  const base = Math.min(MAX_BASE_RADIUS, Math.max(BASE_RADIUS, expectedYards * RADIUS_PER_SWING_YARD));
  const ballMult = getBallEffects(s).pickupRadiusMult ?? 1;
  const magnetMult = s.buffs?.magnet ? MAGNET_RADIUS_MULT : 1;
  return Math.round(base * ballMult * magnetMult);
}

// Distance multiplier from active pickup buffs.
export function getBuffDistanceMultiplier(s) {
  return s.buffs?.tailwindSwings > 0 ? TAILWIND_MULTIPLIER : 1;
}

export function getCoinYards(s) {
  return Math.round(s.targetDistance * COIN_HOLE_SHARE * (getBallEffects(s).coinMult ?? 1));
}

/**
 * Collect pickups near where the ball came to rest and fold their rewards into
 * the pre-swing state. `restAt` is null when the ball was lost.
 *
 * Returns { state, collected, fillFocus }: collected lists what was picked up,
 * for the swing log; fillFocus asks the caller to fill Focus after the swing.
 */
export function collectPickups(s, restAt, expectedYards) {
  if (!Number.isFinite(restAt) || !s.holePickups) return { state: s, collected: [], fillFocus: false };

  let radius = getPickupRadius(s, expectedYards);
  const items = s.holePickups.items.map(item => ({ ...item }));
  // A magnet picked up mid-collection widens the radius for the rest of this pass.
  const order = [...items].sort((a, b) => Math.abs(a.at - restAt) - Math.abs(b.at - restAt));
  const collected = [];
  let fillFocus = false;
  let next = { ...s, buffs: { ...createBuffs(), ...s.buffs } };

  for (const item of order) {
    if (item.collected || Math.abs(item.at - restAt) > radius) continue;
    item.collected = true;
    const def = getPickupById(item.type);
    let detail = def.description;

    if (item.type === 'coin') {
      const coinYards = getCoinYards(next);
      next.totalYardsThisRound += coinYards;
      detail = `+${coinYards} yards for upgrades.`;
    } else if (item.type === 'star') {
      fillFocus = true;
    } else if (item.type === 'clover') {
      next.buffs.clover = true;
    } else if (item.type === 'tailwind') {
      next.buffs.tailwindSwings += TAILWIND_SWINGS;
    } else if (item.type === 'extraBall') {
      next.ballsLeft += 1;
    } else if (item.type === 'magnet' && !next.buffs.magnet) {
      next.buffs.magnet = true;
      radius *= MAGNET_RADIUS_MULT;
    }

    collected.push({ type: item.type, label: def.label, description: detail });
  }

  if (collected.length === 0) return { state: s, collected, fillFocus };

  const byType = { ...(s.lifetimeStats.pickupsByType || {}) };
  for (const pickup of collected) byType[pickup.type] = (byType[pickup.type] ?? 0) + 1;
  next = {
    ...next,
    holePickups: { ...s.holePickups, items },
    lifetimeStats: {
      ...s.lifetimeStats,
      pickups: (s.lifetimeStats.pickups ?? 0) + collected.length,
      pickupsByType: byType,
    },
  };
  return { state: next, collected, fillFocus };
}

// Buffs after a swing is taken: tailwind ticks down, clover is spent.
export function consumeSwingBuffs(buffs) {
  return {
    ...buffs,
    tailwindSwings: Math.max(0, (buffs?.tailwindSwings ?? 0) - 1),
    clover: false,
  };
}
