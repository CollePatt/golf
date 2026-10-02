// Golf balls. One is equipped at a time; each trades a little of one thing for
// a lot of another, so the right ball depends on the course and the goal
// (scoring, farming yards, or collecting pickups).
//
// Ids match the tags in src/assets/sprites/balls.json, so the equipped ball is
// also the sprite drawn in flight.
//
// effects (all optional, read through getBallEffects):
//   distanceMult      : multiplies swing distance
//   themeDistanceMult : { [themePrefix]: mult } extra distance on matching hole themes
//   yardsEarnedMult   : multiplies yards converted into upgrade currency
//   approachErrorMult : multiplies approach miss spread (lower is tighter)
//   puttBonus         : added to one-putt odds
//   sandMultiplier    : replaces the distance multiplier from a bunker lie
//   waterSkipChance   : chance a ball landing in water skips out with no penalty
//   pickupRadiusMult  : multiplies the pickup collection radius
//   extraPickups      : extra pickups placed on every hole
//   coinMult          : multiplies the yards a Coin pickup pays
//
// unlock.progress(state) returns [current, goal]; a ball is unlocked once
// current >= goal. Progress reads lifetime stats and all-time records, so
// unlocked balls stay unlocked after turning pro.
export const BALLS = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'A dependable two-piece ball. No tricks, no trade-offs.',
    effects: {},
    unlock: { label: 'Starter ball', progress: () => [1, 1] },
  },
  {
    id: 'gold',
    label: 'Gold',
    description: '+20% yards earned, Coins pay double. 3% shorter off the club.',
    effects: { yardsEarnedMult: 1.2, coinMult: 2, distanceMult: 0.97 },
    unlock: {
      label: 'Collect 10 Coins',
      progress: state => [state.lifetimeStats.pickupsByType?.coin ?? 0, 10],
    },
  },
  {
    id: 'fire',
    label: 'Fire',
    description: '+12% distance, but approaches spray 20% wider.',
    effects: { distanceMult: 1.12, approachErrorMult: 1.2 },
    unlock: {
      label: 'Hit a 200 yd swing',
      progress: state => [Math.min(200, state.lifetimeStats.bestSwing), 200],
    },
  },
  {
    id: 'ice',
    label: 'Ice',
    description: 'Approaches 25% tighter and +8% one-putt odds. 6% shorter.',
    effects: { approachErrorMult: 0.75, puttBonus: 0.08, distanceMult: 0.94 },
    unlock: {
      label: 'Make 25 one-putts',
      progress: state => [Math.min(25, state.lifetimeStats.onePutts ?? 0), 25],
    },
  },
  {
    id: 'lunar',
    label: 'Lunar',
    description: 'Half of water shots skip out, bunkers barely slow it, +12% on Moon holes.',
    effects: {
      waterSkipChance: 0.5,
      sandMultiplier: 0.9,
      themeDistanceMult: { moon: 1.12, eclipse: 1.12 },
    },
    unlock: {
      label: 'Finish Moon Links',
      progress: state => [state.courseRecords?.moonLinks ? 1 : 0, 1],
    },
  },
  {
    id: 'prism',
    label: 'Prism',
    description: 'One more pickup on every hole and double collection radius.',
    effects: { extraPickups: 1, pickupRadiusMult: 2 },
    unlock: {
      label: 'Collect 75 pickups',
      progress: state => [Math.min(75, state.lifetimeStats.pickups ?? 0), 75],
    },
  },
];

export const DEFAULT_BALL_ID = BALLS[0].id;

export function getBallById(ballId) {
  return BALLS.find(ball => ball.id === ballId) || BALLS[0];
}

export function getBallUnlockProgress(ball, state) {
  const [current, goal] = ball.unlock.progress(state);
  return { current: Math.min(current, goal), goal, unlocked: current >= goal };
}

export function isBallUnlocked(ballId, state) {
  const ball = BALLS.find(entry => entry.id === ballId);
  return Boolean(ball) && getBallUnlockProgress(ball, state).unlocked;
}

export function getBallEffects(state) {
  return getBallById(state?.equippedBall).effects;
}

// Distance multiplier from the equipped ball on a hole with the given theme.
export function getBallDistanceMultiplier(state, holeTheme = '') {
  const effects = getBallEffects(state);
  let mult = effects.distanceMult ?? 1;
  for (const [prefix, themeMult] of Object.entries(effects.themeDistanceMult || {})) {
    if (holeTheme.startsWith(prefix)) mult *= themeMult;
  }
  return mult;
}
