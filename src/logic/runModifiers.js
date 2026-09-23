export const WIND_OPTIONS = [
  {
    id: 'calm',
    label: 'Calm',
    multiplier: 1,
    description: 'No distance change',
  },
  {
    id: 'tailwind',
    label: 'Tailwind',
    multiplier: 1.12,
    description: '+12% swing distance',
  },
  {
    id: 'headwind',
    label: 'Headwind',
    multiplier: 0.9,
    description: '-10% swing distance',
  },
  {
    id: 'crosswind',
    label: 'Crosswind',
    multiplier: 0.96,
    description: '-4% swing distance',
  },
];

export function getWindById(id) {
  return WIND_OPTIONS.find(wind => wind.id === id) || WIND_OPTIONS[0];
}

export function rollWind() {
  return WIND_OPTIONS[Math.floor(Math.random() * WIND_OPTIONS.length)];
}

export function normalizeWind(wind) {
  return getWindById(wind?.id);
}
