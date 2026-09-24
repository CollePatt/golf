export const ACHIEVEMENTS = [
  {
    id: 'firstSwing',
    title: 'First Contact',
    description: 'Take your first swing.',
    rewardYards: 50,
    isUnlocked: state => state.lifetimeStats.swings >= 1,
    progress: state => `${Math.min(1, state.lifetimeStats.swings)} / 1`,
  },
  {
    id: 'firstHole',
    title: 'Cup Found',
    description: 'Clear your first hole.',
    rewardYards: 125,
    isUnlocked: state => state.lifetimeStats.holesCleared >= 1,
    progress: state => `${Math.min(1, state.lifetimeStats.holesCleared)} / 1`,
  },
  {
    id: 'focusedSwing',
    title: 'Locked In',
    description: 'Hit a focused manual swing.',
    rewardYards: 175,
    isUnlocked: state => state.lifetimeStats.focusedSwings >= 1,
    progress: state => `${Math.min(1, state.lifetimeStats.focusedSwings)} / 1`,
  },
  {
    id: 'perfectSwing',
    title: 'Pure Strike',
    description: 'Hit a perfect swing.',
    rewardYards: 200,
    isUnlocked: state => state.lifetimeStats.perfectSwings >= 1,
    progress: state => `${Math.min(1, state.lifetimeStats.perfectSwings)} / 1`,
  },
  {
    id: 'bigDrive',
    title: 'Big Drive',
    description: 'Hit one swing for at least 100 yards.',
    rewardYards: 250,
    isUnlocked: state => state.lifetimeStats.bestSwing >= 100,
    progress: state => `${Math.min(100, state.lifetimeStats.bestSwing)} / 100`,
  },
  {
    id: 'frontNine',
    title: 'Made The Turn',
    description: 'Clear 9 lifetime holes.',
    rewardYards: 350,
    isUnlocked: state => state.lifetimeStats.holesCleared >= 9,
    progress: state => `${Math.min(9, state.lifetimeStats.holesCleared)} / 9`,
  },
  {
    id: 'kiloyard',
    title: 'Kiloyard Club',
    description: 'Earn 1,000 lifetime yards.',
    rewardYards: 400,
    isUnlocked: state => state.lifetimeStats.yards >= 1000,
    progress: state => `${Math.min(1000, state.lifetimeStats.yards)} / 1000`,
  },
  {
    id: 'courseComplete',
    title: 'Course Complete',
    description: 'Finish all 18 holes on a course.',
    rewardYards: 1000,
    isUnlocked: state => state.lifetimeStats.coursesCompleted >= 1,
    progress: state => `${Math.min(1, state.lifetimeStats.coursesCompleted)} / 1`,
  },
];

export function getUnlockedAchievementCount(achievements = {}) {
  return ACHIEVEMENTS.filter(achievement => achievements[achievement.id]).length;
}
