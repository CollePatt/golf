export const SWING_MODES = [
  {
    id: 'safe',
    label: 'Safe',
    description: 'Shorter and steadier. Builds a little extra Focus.',
    distanceMultiplier: 0.85,
    varianceMin: 0.97,
    varianceMax: 1.04,
    perfectChance: 0.03,
    perfectMultiplier: 1.18,
    focusGainBonus: 8,
  },
  {
    id: 'normal',
    label: 'Normal',
    description: 'Balanced distance, variance, and Focus gain.',
    distanceMultiplier: 1,
    varianceMin: 0.92,
    varianceMax: 1.08,
    perfectChance: 0.06,
    perfectMultiplier: 1.35,
    focusGainBonus: 0,
  },
  {
    id: 'aggressive',
    label: 'Aggressive',
    description: 'Bigger potential carry with a much wider miss window.',
    distanceMultiplier: 1.22,
    varianceMin: 0.74,
    varianceMax: 1.26,
    perfectChance: 0.09,
    perfectMultiplier: 1.55,
    focusGainBonus: -4,
  },
];

export function getSwingMode(modeId) {
  return SWING_MODES.find(mode => mode.id === modeId) || SWING_MODES[1];
}
