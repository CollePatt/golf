// Course pickups. A few spawn along every hole; a ball that comes to rest
// close enough collects them. Ids match the tags in
// src/assets/sprites/pickups.json.
//
// weight: relative spawn chance.
export const PICKUPS = [
  {
    id: 'coin',
    label: 'Coin',
    description: 'Bonus upgrade yards equal to the hole length.',
    weight: 30,
  },
  {
    id: 'star',
    label: 'Star',
    description: 'Fills Focus. Your next manual swing is a Focused swing.',
    weight: 14,
  },
  {
    id: 'clover',
    label: 'Clover',
    description: 'Your next swing is guaranteed Perfect.',
    weight: 14,
  },
  {
    id: 'tailwind',
    label: 'Tailwind',
    description: 'Your next 3 swings carry 15% farther.',
    weight: 18,
  },
  {
    id: 'extraBall',
    label: 'Extra Ball',
    description: '+1 ball for this round.',
    weight: 12,
  },
  {
    id: 'magnet',
    label: 'Magnet',
    description: 'Triples pickup radius for the rest of the hole.',
    weight: 10,
  },
];

export const TAILWIND_SWINGS = 3;
export const TAILWIND_MULTIPLIER = 1.15;
export const COIN_HOLE_SHARE = 1;
export const MAGNET_RADIUS_MULT = 3;

export function getPickupById(pickupId) {
  return PICKUPS.find(pickup => pickup.id === pickupId) || null;
}
