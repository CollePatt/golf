// Tier 2 upgrades, bought with Pro Points earned by turning pro (prestige).
// They survive every prestige reset.
//
// Effects reuse the Tier 1 effect types where possible (see swingLogic.js), plus:
//   unlockCourse    : each level opens the next Course Pass course (see courses.js)
//   yardsEarnedMult : multiplies the yards converted into upgrade currency by value^level
//   signingBonus    : adds value × level to the share of last cycle's yards paid out on turning pro
//
// Cost to buy the next level (level → level+1) is:
//   baseCost × costGrowth ^ level   (whole Pro Points)
export const PRO_UPGRADES = [
  {
    id: 'proClubs',
    label: 'Pro Clubs',
    description: '×1.3 yards per swing per level',
    baseCost: 2,
    costGrowth: 1.7,
    maxLevel: 12,
    effects: [{ type: 'multYards', value: 1.3 }],
  },
  {
    id: 'coursePass',
    label: 'Course Pass',
    description: 'Each level opens a new tour course',
    baseCost: 4,
    costGrowth: 1.9,
    maxLevel: 3,
    effects: [{ type: 'unlockCourse', value: 1 }],
  },
  {
    id: 'autoDriver',
    label: 'Auto Driver',
    description: 'Free Auto Caddie levels that survive turning pro',
    baseCost: 3,
    costGrowth: 2,
    maxLevel: 5,
    effects: [{ type: 'autoSwing', value: 1 }],
  },
  {
    id: 'yardageBook',
    label: 'Yardage Book',
    description: '×1.2 yards earned for upgrades per level',
    baseCost: 2,
    costGrowth: 1.8,
    maxLevel: 10,
    effects: [{ type: 'yardsEarnedMult', value: 1.2 }],
  },
  {
    id: 'tourBag',
    label: 'Tour Bag',
    description: '+5 starting balls per level',
    baseCost: 1,
    costGrowth: 1.6,
    maxLevel: 10,
    effects: [{ type: 'addBalls', value: 5 }],
  },
  {
    id: 'signingBonus',
    label: 'Signing Bonus',
    description: '+10% of last cycle\'s yards paid out when you turn pro, per level',
    baseCost: 3,
    costGrowth: 2.2,
    maxLevel: 5,
    effects: [{ type: 'signingBonus', value: 0.1 }],
  },
];

export function getProUpgradeById(upgradeId) {
  return PRO_UPGRADES.find(upgrade => upgrade.id === upgradeId) || null;
}

export function getProUpgradeCost(def, level) {
  if (level >= def.maxLevel) return Infinity;
  return Math.floor(def.baseCost * Math.pow(def.costGrowth, level));
}
