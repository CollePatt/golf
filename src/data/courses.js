export const COURSES = [
  {
    id: 'meadowMunicipal',
    name: 'Meadow Municipal',
    description: 'A forgiving local course that gets longer and moodier as the round goes on.',
    targetBase: 300,
    targetStep: 50,
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
  {
    id: 'moonLinks',
    name: 'Moon Links',
    description: 'A low-gravity course with long carries, crater lips, and a very quiet gallery.',
    targetBase: 380,
    targetStep: 65,
    holes: [
      ['Tranquility Tee', 'moon', 'Low Gravity', '+30% swing distance', 1.3],
      ['Crater Cup', 'moon', 'Crater Lip', '-8% swing distance', 0.92],
      ['Dust Sea', 'moon', 'Vacuum Carry', '+22% swing distance', 1.22],
      ['Surveyor Slope', 'moon', 'Powder Lie', '-10% swing distance', 0.9],
      ['Orbiter Arc', 'moonrise', 'Launch Window', '+28% swing distance', 1.28],
      ['Shadow Basin', 'moonrise', 'Cold Roll', '-6% swing distance', 0.94],
      ['Apollo Alley', 'moonrise', 'Clean Trajectory', '+18% swing distance', 1.18],
      ['Module Bend', 'moonrise', 'Tight Angle', '-7% swing distance', 0.93],
      ['Mare Ridge', 'moonrise', 'Long Bounce', '+20% swing distance', 1.2],
      ['Eclipse Turn', 'eclipse', 'Dim Read', '-9% swing distance', 0.91],
      ['Black Sky Drive', 'eclipse', 'No Air Drag', '+32% swing distance', 1.32],
      ['Static Green', 'eclipse', 'Charged Turf', '+12% swing distance', 1.12],
      ['Comet Cut', 'eclipse', 'Sharp Dogleg', '-8% swing distance', 0.92],
      ['Earthrise Carry', 'moon', 'Big View', '+24% swing distance', 1.24],
      ['Solar Flare', 'moon', 'Bright Line', '+16% swing distance', 1.16],
      ['Silent Gallery', 'eclipse', 'Heavy Nerves', '-6% swing distance', 0.94],
      ['Lunar Ladder', 'eclipse', 'Climb Out', '-10% swing distance', 0.9],
      ['Home Module', 'eclipse', 'Return Burn', '+35% swing distance', 1.35],
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
  moon: {
    skyTop: '#111827',
    skyBottom: '#29365f',
    ground: '#59616f',
    fairway: '#9aa2b2',
    flag: '#7dd3fc',
  },
  moonrise: {
    skyTop: '#172033',
    skyBottom: '#56627f',
    ground: '#4b5563',
    fairway: '#aeb7c6',
    flag: '#facc15',
  },
  eclipse: {
    skyTop: '#0b1020',
    skyBottom: '#4c3f6f',
    ground: '#3f3f46',
    fairway: '#a3a3a3',
    flag: '#f0abfc',
  },
};

export function getCourseById(courseId) {
  return COURSES.find(course => course.id === courseId) || COURSES[0];
}

export function getHoleDefinition(courseId, hole) {
  const course = getCourseById(courseId);
  return course.holes[hole - 1] || course.holes[0];
}

export function getNextCourseId(courseId) {
  const courseIndex = COURSES.findIndex(course => course.id === courseId);
  if (courseIndex < 0 || courseIndex >= COURSES.length - 1) return null;
  return COURSES[courseIndex + 1].id;
}

export function getCourseTheme(themeId) {
  return COURSE_THEMES[themeId] || COURSE_THEMES.morning;
}
