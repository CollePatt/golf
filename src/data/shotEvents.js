export const SHOT_EVENTS = [
  {
    id: 'greatBounce',
    label: 'Great Bounce',
    description: '+15% bonus yards',
    chance: 0.08,
    multiplier: 1.15,
    focusGain: 0,
  },
  {
    id: 'cartPath',
    label: 'Cart Path',
    description: '+35% bonus yards',
    chance: 0.035,
    multiplier: 1.35,
    focusGain: 0,
  },
  {
    id: 'crowdRoar',
    label: 'Crowd Roar',
    description: '+25 Focus on manual swings',
    chance: 0.06,
    multiplier: 1,
    focusGain: 25,
  },
  {
    id: 'heavyRough',
    label: 'Heavy Rough',
    description: '-12% yards',
    chance: 0.04,
    multiplier: 0.88,
    focusGain: 0,
  },
];

export function rollShotEvent() {
  const roll = Math.random();
  let threshold = 0;

  for (const event of SHOT_EVENTS) {
    threshold += event.chance;
    if (roll < threshold) return event;
  }

  return null;
}
