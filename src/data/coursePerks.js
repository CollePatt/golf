export const COURSE_PERKS = [
  {
    id: 'lowGravityPractice',
    label: 'Low Gravity Practice',
    description: '+25% swing distance for the next course attempt.',
    effect: { type: 'distanceMultiplier', value: 1.25 },
  },
  {
    id: 'extraSleeve',
    label: 'Extra Sleeve',
    description: '+8 starting balls for the next course attempt.',
    effect: { type: 'addStartingBalls', value: 8 },
  },
  {
    id: 'focusCoach',
    label: 'Focus Coach',
    description: '+10 Focus from each manual swing for the next course attempt.',
    effect: { type: 'addFocusGain', value: 10 },
  },
];

export function getCoursePerkById(perkId) {
  return COURSE_PERKS.find(perk => perk.id === perkId) || null;
}

export function createCoursePerkChoices() {
  return COURSE_PERKS.map(perk => perk.id);
}

export function getCoursePerkDistanceMultiplier(perkId) {
  const perk = getCoursePerkById(perkId);
  return perk?.effect.type === 'distanceMultiplier' ? perk.effect.value : 1;
}

export function getCoursePerkStartingBalls(perkId) {
  const perk = getCoursePerkById(perkId);
  return perk?.effect.type === 'addStartingBalls' ? perk.effect.value : 0;
}

export function getCoursePerkFocusGain(perkId) {
  const perk = getCoursePerkById(perkId);
  return perk?.effect.type === 'addFocusGain' ? perk.effect.value : 0;
}
