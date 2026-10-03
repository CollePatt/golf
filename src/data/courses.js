function toHoleDefinition([name, theme, label, description, distanceMultiplier]) {
  return {
    name,
    theme,
    trait: {
      label,
      description,
      distanceMultiplier,
    },
  };
}

// unlock:
//   start: always available
//   chain: available once `after` is completed in the current pro cycle
//   coursePass: available once the Course Pass Tier 2 upgrade reaches `level`
//
// prestigeValue: Pro Points for an even-par finish (see prestigeLogic.js).
// designYards: the swing distance the course is built for. Par assumes that many
//   yards per swing to reach the green, plus two putts (see parForHole).
// hazardNames: what water and bunker hazards are called on this course.
// hazardLooks: how the hole canvas draws them (see GolfHoleCanvas.jsx).
// hazardPattern: where they sit; courses without one use HAZARD_PATTERN.
export const COURSES = [
  {
    id: 'meadowMunicipal',
    name: 'Meadow Municipal',
    description: 'A forgiving local course that gets longer and moodier as the round goes on.',
    targetBase: 200,
    targetStep: 30,
    designYards: 260,
    hazardNames: { water: 'Creek', bunker: 'Fairway Bunker' },
    hazardLooks: { water: 'water', bunker: 'sand' },
    unlock: { type: 'start' },
    prestigeValue: 4,
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
    ].map(toHoleDefinition),
  },
  {
    id: 'moonLinks',
    name: 'Moon Links',
    description: 'A low-gravity course with long carries, crater lips, and a very quiet gallery.',
    targetBase: 360,
    targetStep: 60,
    designYards: 440,
    hazardNames: { water: 'Coolant Pool', bunker: 'Crater' },
    hazardLooks: { water: 'coolant', bunker: 'crater' },
    hazardPattern: [
      // Pocked with small craters; one coolant pool guards a few long holes.
      { every: 2, offset: 1, type: 'bunker', from: 0.24, to: 0.3 },
      { every: 3, offset: 0, type: 'bunker', from: 0.58, to: 0.66 },
      { every: 6, offset: 4, type: 'water', from: 0.7, to: 0.8 },
    ],
    unlock: { type: 'chain', after: 'meadowMunicipal' },
    prestigeValue: 6,
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
    ].map(toHoleDefinition),
  },
  {
    id: 'saharaSands',
    name: 'Sahara Sands',
    description: 'Endless dunes, baked fairways that roll forever, and bunkers the size of towns.',
    targetBase: 520,
    targetStep: 80,
    designYards: 700,
    hazardNames: { water: 'Oasis', bunker: 'Dune Trap' },
    hazardLooks: { water: 'oasis', bunker: 'dune' },
    hazardPattern: [
      // Wide dune traps on every other hole; the rare oasis sits past them.
      { every: 2, offset: 0, type: 'bunker', from: 0.35, to: 0.52 },
      { every: 5, offset: 3, type: 'bunker', from: 0.66, to: 0.8 },
      { every: 7, offset: 6, type: 'water', from: 0.56, to: 0.64 },
    ],
    unlock: { type: 'coursePass', level: 1 },
    prestigeValue: 10,
    holes: [
      ['Oasis Opener', 'dune', 'Hardpan Roll', '+14% swing distance', 1.14],
      ['Camel Crossing', 'dune', 'Soft Sand', '-9% swing distance', 0.91],
      ['Wadi Run', 'dune', 'Dry Riverbed', '+18% swing distance', 1.18],
      ['Sandstorm Ridge', 'dune', 'Gritty Gust', '-12% swing distance', 0.88],
      ['Caravan Line', 'dune', 'Packed Track', '+10% swing distance', 1.1],
      ['Mirage Flats', 'mirage', 'False Read', '-6% swing distance', 0.94],
      ['Heat Shimmer', 'mirage', 'Thin Hot Air', '+16% swing distance', 1.16],
      ['Glass Sand', 'mirage', 'Fused Crust', '+20% swing distance', 1.2],
      ['Scorpion Bowl', 'mirage', 'Deep Bunker', '-14% swing distance', 0.86],
      ['Sun Dial', 'mirage', 'Noon Glare', '-5% swing distance', 0.95],
      ['Pyramid Carry', 'mirage', 'High Launch', '+12% swing distance', 1.12],
      ['Dune Sea', 'dusk', 'Rolling Crest', '+22% swing distance', 1.22],
      ['Bedouin Bend', 'dusk', 'Cooling Air', '+4% swing distance', 1.04],
      ['Salt Pan', 'dusk', 'Flat Bake', '+25% swing distance', 1.25],
      ['Vulture Rock', 'dusk', 'Ragged Lie', '-10% swing distance', 0.9],
      ['Last Well', 'dusk', 'Thirsty Turf', '-7% swing distance', 0.93],
      ['Starfall Dune', 'dusk', 'Night Wind', '+8% swing distance', 1.08],
      ['Sultan Green', 'dusk', 'Grand Finish', '+28% swing distance', 1.28],
    ].map(toHoleDefinition),
  },
  {
    id: 'glacierGreens',
    name: 'Glacier Greens',
    description: 'Ice-slick fairways and thin alpine air. Long carries, but snowbanks swallow mistakes.',
    targetBase: 700,
    targetStep: 100,
    designYards: 950,
    hazardNames: { water: 'Meltwater', bunker: 'Snowbank' },
    hazardLooks: { water: 'meltwater', bunker: 'snow' },
    hazardPattern: [
      // Narrow meltwater channels early, snowbanks short of the green.
      { every: 3, offset: 1, type: 'water', from: 0.28, to: 0.36 },
      { every: 3, offset: 2, type: 'water', from: 0.55, to: 0.62 },
      { every: 2, offset: 0, type: 'bunker', from: 0.78, to: 0.86 },
    ],
    unlock: { type: 'coursePass', level: 2 },
    prestigeValue: 15,
    holes: [
      ['Base Camp', 'frost', 'Fresh Powder', '-8% swing distance', 0.92],
      ['Ice Shelf', 'frost', 'Glass Roll', '+26% swing distance', 1.26],
      ['Crevasse Hop', 'frost', 'Nervy Carry', '-6% swing distance', 0.94],
      ['Penguin Parade', 'frost', 'Slide Out', '+18% swing distance', 1.18],
      ['Snowcat Track', 'frost', 'Groomed Lane', '+12% swing distance', 1.12],
      ['Avalanche Chute', 'frost', 'Downhill Blast', '+30% swing distance', 1.3],
      ['Frozen Falls', 'aurora', 'Icicle Drag', '-10% swing distance', 0.9],
      ['Northern Lights', 'aurora', 'Clear Night', '+14% swing distance', 1.14],
      ['Polar Pin', 'aurora', 'Frost Bite', '-12% swing distance', 0.88],
      ['Igloo Turn', 'aurora', 'Tight Dogleg', '-5% swing distance', 0.95],
      ['Seracs', 'aurora', 'Thin Air', '+20% swing distance', 1.2],
      ['Moraine Ridge', 'aurora', 'Loose Scree', '-8% swing distance', 0.92],
      ['Whiteout', 'blizzard', 'Blind Line', '-15% swing distance', 0.85],
      ['Ski Jump', 'blizzard', 'Launch Ramp', '+35% swing distance', 1.35],
      ['Yeti Rough', 'blizzard', 'Deep Drift', '-12% swing distance', 0.88],
      ['Summit Push', 'blizzard', 'Altitude', '+24% swing distance', 1.24],
      ['Cornice Edge', 'blizzard', 'Wind Lip', '+6% swing distance', 1.06],
      ['Peak Green', 'blizzard', 'On Top Of The World', '+32% swing distance', 1.32],
    ].map(toHoleDefinition),
  },
  {
    id: 'calderaClassic',
    name: 'Caldera Classic',
    description: 'A championship course inside an active volcano. Updrafts launch the ball, ash buries it.',
    targetBase: 950,
    targetStep: 130,
    designYards: 1250,
    hazardNames: { water: 'Lava Flow', bunker: 'Ash Pit' },
    hazardLooks: { water: 'lava', bunker: 'ash' },
    hazardPattern: [
      // Lava forced carries off the tee, ash pits where the drives come down.
      { every: 2, offset: 1, type: 'water', from: 0.3, to: 0.44 },
      { every: 4, offset: 0, type: 'water', from: 0.6, to: 0.7 },
      { every: 3, offset: 2, type: 'bunker', from: 0.5, to: 0.58 },
    ],
    unlock: { type: 'coursePass', level: 3 },
    prestigeValue: 22,
    holes: [
      ['Obsidian Tee', 'ember', 'Glassy Lie', '+16% swing distance', 1.16],
      ['Lava Tube', 'ember', 'Tunnel Shot', '-8% swing distance', 0.92],
      ['Basalt Steps', 'ember', 'Terraced Roll', '+12% swing distance', 1.12],
      ['Sulfur Springs', 'ember', 'Steam Cloud', '-10% swing distance', 0.9],
      ['Updraft Alley', 'ember', 'Thermal Lift', '+34% swing distance', 1.34],
      ['Pumice Field', 'ash', 'Floaty Turf', '+20% swing distance', 1.2],
      ['Ash Fall', 'ash', 'Grey Out', '-14% swing distance', 0.86],
      ['Fumarole Bend', 'ash', 'Hot Vent', '+26% swing distance', 1.26],
      ['Cinder Cone', 'ash', 'Loose Cinders', '-12% swing distance', 0.88],
      ['Smoke Signal', 'ash', 'Hazy Read', '-6% swing distance', 0.94],
      ['Rim Walk', 'ash', 'Edge Nerves', '-4% swing distance', 0.96],
      ['Magma Moat', 'magma', 'Forced Carry', '-10% swing distance', 0.9],
      ['Pyroclast Drive', 'magma', 'Eruption Boost', '+38% swing distance', 1.38],
      ['Dragon Spine', 'magma', 'Ridge Bounce', '+18% swing distance', 1.18],
      ['Crucible', 'magma', 'Heat Haze', '-8% swing distance', 0.92],
      ['Flowfront', 'magma', 'Moving Ground', '+10% swing distance', 1.1],
      ['Vent Shot', 'magma', 'Blast Lift', '+30% swing distance', 1.3],
      ['Caldera Cup', 'magma', 'Final Eruption', '+40% swing distance', 1.4],
    ].map(toHoleDefinition),
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
  dune: {
    skyTop: '#e9a23b',
    skyBottom: '#fbe3a6',
    ground: '#b9853f',
    fairway: '#d9b26a',
    flag: '#0f766e',
  },
  mirage: {
    skyTop: '#f2c14e',
    skyBottom: '#fdf3c4',
    ground: '#c08a43',
    fairway: '#e3c27d',
    flag: '#be123c',
  },
  dusk: {
    skyTop: '#5b2a6e',
    skyBottom: '#f08a5d',
    ground: '#7a4e2d',
    fairway: '#b98a52',
    flag: '#facc15',
  },
  frost: {
    skyTop: '#7fb8e6',
    skyBottom: '#e6f4fb',
    ground: '#b9d3e3',
    fairway: '#e8f3f8',
    flag: '#dc2626',
  },
  aurora: {
    skyTop: '#0b1d33',
    skyBottom: '#1f6f78',
    ground: '#6b8ba3',
    fairway: '#c3d9e6',
    flag: '#4ade80',
  },
  blizzard: {
    skyTop: '#8a99a8',
    skyBottom: '#dfe6ec',
    ground: '#a7b6c2',
    fairway: '#f1f5f9',
    flag: '#f97316',
  },
  ember: {
    skyTop: '#3b0d0c',
    skyBottom: '#c2410c',
    ground: '#292524',
    fairway: '#57534e',
    flag: '#fde047',
  },
  ash: {
    skyTop: '#44403c',
    skyBottom: '#a8a29e',
    ground: '#3f3a36',
    fairway: '#78716c',
    flag: '#f97316',
  },
  magma: {
    skyTop: '#1c0a05',
    skyBottom: '#7c2d12',
    ground: '#1c1917',
    fairway: '#44403c',
    flag: '#fbbf24',
  },
};

export function getCourseById(courseId) {
  return COURSES.find(course => course.id === courseId) || COURSES[0];
}

export function getHoleDefinition(courseId, hole) {
  const course = getCourseById(courseId);
  return course.holes[hole - 1] || course.holes[0];
}

// Fairway hazards follow a fixed rhythm so each hole plays the same every visit.
// Bands are fractions of hole length, measured from the tee. A hole matches a
// row when hole % every === offset.
const HAZARD_PATTERN = [
  { every: 3, offset: 0, type: 'water', from: 0.42, to: 0.56 },
  { every: 4, offset: 2, type: 'bunker', from: 0.62, to: 0.72 },
  { every: 5, offset: 1, type: 'bunker', from: 0.3, to: 0.38 },
];

export function getHoleHazards(courseId, hole, targetDistance) {
  const course = getCourseById(courseId);
  const names = course.hazardNames || { water: 'Water', bunker: 'Bunker' };
  const looks = course.hazardLooks || { water: 'water', bunker: 'sand' };
  return (course.hazardPattern || HAZARD_PATTERN)
    .filter(pattern => hole % pattern.every === pattern.offset)
    .map(pattern => ({
      type: pattern.type,
      name: names[pattern.type],
      look: looks[pattern.type],
      start: Math.round(targetDistance * pattern.from),
      end: Math.round(targetDistance * pattern.to),
    }));
}

export function getNextCourseId(courseId) {
  const courseIndex = COURSES.findIndex(course => course.id === courseId);
  if (courseIndex < 0 || courseIndex >= COURSES.length - 1) return null;
  return COURSES[courseIndex + 1].id;
}

export function isValidCourseId(courseId) {
  return COURSES.some(course => course.id === courseId);
}

// Courses whose completion is required before going pro.
export const PRO_CHAIN_COURSE_IDS = COURSES
  .filter(course => course.unlock.type !== 'coursePass')
  .map(course => course.id);

export function isCourseUnlocked(courseId, { completedCourseIds = [], coursePassLevel = 0 } = {}) {
  if (!isValidCourseId(courseId)) return false;
  const { unlock } = getCourseById(courseId);
  if (unlock.type === 'start') return true;
  if (unlock.type === 'chain') return completedCourseIds.includes(unlock.after);
  if (unlock.type === 'coursePass') return coursePassLevel >= unlock.level;
  return false;
}

export function describeCourseUnlock(courseId) {
  const { unlock } = getCourseById(courseId);
  if (unlock.type === 'chain') return `Complete ${getCourseById(unlock.after).name} this pro cycle.`;
  if (unlock.type === 'coursePass') return `Requires Course Pass level ${unlock.level}.`;
  return 'Always open.';
}

export function getCourseTheme(themeId) {
  return COURSE_THEMES[themeId] || COURSE_THEMES.morning;
}
