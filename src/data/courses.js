export const COURSES = [
  {
    id: 'meadowMunicipal',
    name: 'Meadow Municipal',
    description: 'A forgiving local course that gets longer and moodier as the round goes on.',
    holes: [
      ['Starter Strip', 'morning', 'Fresh Fairway', '+5% swing distance', 1.05],
      ['Willow Bend', 'morning', 'Soft Turf', '-4% swing distance', 0.96],
      ['Cart Path Kiss', 'morning', 'Friendly Roll', '+8% swing distance', 1.08],
      ['Creek Carry', 'morning', 'Nervy Tee', '-3% swing distance', 0.97],
      ['Ranger Shortcut', 'morning', 'Cut Corner', '+6% swing distance', 1.06],
      ['Clubhouse Turn', 'morning', 'Flat Lie', 'No distance change', 1],
      ['Pine Needle Run', 'pines', 'Needle Floor', '-5% swing distance', 0.95],
      ['Split Oak', 'pines', 'Clean Window', '+4% swing distance', 1.04],
      ['Long Shade', 'pines', 'Heavy Air', '-6% swing distance', 0.94],
      ['Back Nine Gate', 'pines', 'Momentum', '+7% swing distance', 1.07],
      ['Bunker Ladder', 'pines', 'Uphill Bite', '-7% swing distance', 0.93],
      ['Quiet Cart Bridge', 'pines', 'Settled Rhythm', '+3% swing distance', 1.03],
      ['Golden Dogleg', 'sunset', 'Fast Fairway', '+10% swing distance', 1.1],
      ['Hilltop Lookout', 'sunset', 'Thin Air', '+6% swing distance', 1.06],
      ['Water Tower', 'sunset', 'Cautious Line', '-5% swing distance', 0.95],
      ['Gallery Rise', 'sunset', 'Adrenaline', '+8% swing distance', 1.08],
      ['Last Light', 'sunset', 'Long Shadows', '-4% swing distance', 0.96],
      ['Home Green', 'sunset', 'Championship Nerves', '+12% swing distance', 1.12],
    ].map(([name, theme, label, description, distanceMultiplier]) => ({
      name,
      theme,
      trait: {
        label,
        description,
        distanceMultiplier,
      },
    })),
  },
];

export const COURSE_THEMES = {
  morning: {
    skyTop: '#74b7e6',
    skyBottom: '#d0ecf8',
    ground: '#3f7737',
    fairway: '#5a9b4e',
    flag: '#e53935',
  },
  pines: {
    skyTop: '#5c8fb6',
    skyBottom: '#bdd2df',
    ground: '#244d36',
    fairway: '#39784a',
    flag: '#ffb703',
  },
  sunset: {
    skyTop: '#d9855e',
    skyBottom: '#f4d7a1',
    ground: '#4f6232',
    fairway: '#76934a',
    flag: '#ef476f',
  },
};

export function getCourseById(courseId) {
  return COURSES.find(course => course.id === courseId) || COURSES[0];
}

export function getHoleDefinition(courseId, hole) {
  const course = getCourseById(courseId);
  return course.holes[hole - 1] || course.holes[0];
}

export function getCourseTheme(themeId) {
  return COURSE_THEMES[themeId] || COURSE_THEMES.morning;
}
