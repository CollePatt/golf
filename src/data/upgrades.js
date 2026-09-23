// Permanent upgrade definitions. Each upgrade is leveled.
//
// Effect application (in swingLogic.js):
//   addYards : adds value × level to yards per swing
//   multYards: multiplies yards per swing by value^level
//   addBalls : adds value × level to starting balls
//
// Cost to buy the next level (level → level+1) is:
//   baseCost × costGrowth ^ level
//
// One-shot upgrades use maxLevel: 1.
export const UPGRADES = [
  {
    id: 'betterClub',
    label: 'Better Club',
    description: '+5 yards per swing per level',
    baseCost: 50,
    costGrowth: 1.5,
    maxLevel: 15,
    effects: [{ type: 'addYards', value: 5 }],
  },
  {
    id: 'extraBalls',
    label: 'Extra Balls',
    description: '+4 starting balls per level',
    baseCost: 75,
    costGrowth: 1.5,
    maxLevel: 15,
    effects: [{ type: 'addBalls', value: 4 }],
  },
  {
    id: 'luckySwing',
    label: 'Lucky Swing',
    description: '×1.1 yards per swing per level',
    baseCost: 300,
    costGrowth: 1.4,
    maxLevel: 10,
    effects: [{ type: 'multYards', value: 1.1 }],
  },
];

export function getUpgradeCost(def, level) {
  if (level >= def.maxLevel) return Infinity;
  return Math.floor(def.baseCost * Math.pow(def.costGrowth, level));
}

export function isMaxed(def, state) {
  return state.level >= def.maxLevel;
}
