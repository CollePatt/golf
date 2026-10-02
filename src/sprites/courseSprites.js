import { buildSprite, shade } from './pixelSprite.js'

export const PX = 3

export const BALL = [
  '.WW.',
  'WWWL',
  'WWLL',
  '.LL.',
]

const FLAG_A = [
  'PFFFFFF..',
  'PFFFFFFFf',
  'PFFFFFFf.',
  'PFFFFf...',
  'Pf.......',
  'P........',
  'P........',
  'P........',
  'P........',
  'P........',
  'P........',
  'P........',
  'P........',
  'P........',
  'p........',
]

const FLAG_B = [
  'PFFFFF...',
  'PFFFFFFF.',
  'PFFFFFFFf',
  'PFFFFFff.',
  'Pff......',
  'P........',
  'P........',
  'P........',
  'P........',
  'P........',
  'P........',
  'P........',
  'P........',
  'P........',
  'p........',
]

const OAK = [
  '.....GGGGG.....',
  '...GGGGGGGGG...',
  '..GGGLLGGGGGG..',
  '.GGLLLGGGGGDGG.',
  '.GGLLGGGGGGDDG.',
  'GGGGGGGGGDGGDGG',
  'GGGGGGGGGGGDDGG',
  'GGLLGGGGGDDDGGG',
  '.GGGGGGGDDDDGG.',
  '.GGGGDGGGDDDGG.',
  '..GGDDDDTDDDG..',
  '...GDDDTTDDG...',
  '......TTT......',
  '......TTT......',
  '......TTT......',
  '.....TTTTT.....',
  '....TT.T.TT....',
]

const PINE = [
  '....D....',
  '...DGD...',
  '...GGD...',
  '..DGGGD..',
  '..GLGGD..',
  '.DGGGGGD.',
  '...GGD...',
  '..DGLGD..',
  '.DGGGGGD.',
  'DGGLGGGDD',
  '..DGGGD..',
  '.DGLGGGD.',
  'DGGGGGGDD',
  'GGLGGGGGD',
  '....T....',
  '....T....',
  '...TTT...',
]

const BUSH = [
  '..GGGG...',
  '.GLLGGGG.',
  'GGLGGGDGG',
  'GGGGGDDGG',
  '.DDDDDDD.',
]

const FLOWERS = [
  '.F...F.',
  'FYF.FYF',
  '.G...G.',
  '.G.G.G.',
]

const CLOUD = [
  '.....WWWW.......',
  '...WWWWWWWW.....',
  '..WWWWWWWWWWWW..',
  '.WWWWWWWWWWWWWW.',
  'WWWWWWWWWWWWWWWW',
  '.SSSSSSSSSSSSSS.',
]

const SUN = [
  '...YYY...',
  '.YYYYYYY.',
  '.YYYYYYy.',
  'YYYYYYYyy',
  'YYYYYYYyy',
  'YYYYYYyyy',
  '.YYYYyyy.',
  '.yyyyyyy.',
  '...yyy...',
]

const EARTH = [
  '....BBB....',
  '..BBGGBBB..',
  '.BGGGGBBWB.',
  '.BGGGBBBBB.',
  'BBBGBBBBGBB',
  'BWBBBBBGGGB',
  'BBBBBBBGGBb',
  '.BBWWBBBGb.',
  '.BBBBBBBbb.',
  '..bBBBbbb..',
  '....bbb....',
]

const ECLIPSE = [
  '....CCCCC....',
  '..CCcccccCC..',
  '.CcckkkkkccC.',
  '.CckkkkkkkcC.',
  'CckkkkkkkkkcC',
  'CckkkkkkkkkcC',
  'CckkkkkkkkkcC',
  'CckkkkkkkkkcC',
  'CckkkkkkkkkcC',
  '.CckkkkkkkcC.',
  '.CcckkkkkccC.',
  '..CCcccccCC..',
  '....CCCCC....',
]

const LANDER = [
  '.....OOOO.....',
  '....OGGGGO....',
  '...OGWWGGGO...',
  '..OOOOOOOOOO..',
  '..OYYyYYyYYO..',
  '..OYyYYyYYyO..',
  '..OYYYyYYYYO..',
  '..OOOOOOOOOO..',
  '..L.L....L.L..',
  '.L...L..L...L.',
  'L....L..L....L',
  'L.....LL.....L',
  'LL..........LL',
]

const ROCK = [
  '..RRR.',
  '.RrRRR',
  'RrrRRD',
  'DDDDDD',
]

const CRATER = [
  '....LLLLLL....',
  '.LLDDDDDDDDLL.',
  'LDDdddddddDDDL',
  '.LLDDDDDDDDLL.',
]

const GRASS_TILE = [
  '..g.....g...g...',
  '.gG..g..Gg.gG..g',
  'GGGGGGGGGGGGGGGG',
  'GGGGGgGGGGGGGgGG',
  'GGgGGGGGGgGGGGGG',
]

const MOON_TILE = [
  'GGGGGGGGGGGGGGGG',
  'GGgGGGGGGlGGGGGG',
  'GGGGGGgGGGGGGGgG',
  'GlGGGGGGGGGgGGGG',
  'GGGGGgGGGGGGGGGG',
]

const DIRT_TILE = [
  'DDDDDDDDDDDDDDDD',
  'DDdDDDDDDDDDdDDD',
  'DDDDDDDDdDDDDDDD',
  'DDDDDDDDDDDDDDDD',
  'DDDDDdDDDDDDDDDd',
  'DDDDDDDDDDDDDDDD',
  'DdDDDDDDDDdDDDDD',
  'DDDDDDDDDDDDDDDD',
]

// Per-theme scenery recipes. Palette keys map to the characters above.
export const SCENERY = {
  morning: {
    golfer: 'meadow',
    leaves: { G: '#4e9a45', L: '#7cc164', D: '#2f6a32', T: '#6b4428' },
    tree: 'oak',
    hills: ['#9cc8a0', '#6ea56c'],
    sky: { kind: 'sun', x: 0.82, y: 38, colors: { Y: '#fff2a8', y: '#ffd866' } },
    clouds: '#ffffff',
    decor: 'flowers',
  },
  pines: {
    golfer: 'meadow',
    leaves: { G: '#2f6b46', L: '#4f9461', D: '#1b4a31', T: '#5a3a22' },
    tree: 'pine',
    hills: ['#8fb0bf', '#4f7a66'],
    sky: null,
    clouds: '#e3edf2',
    decor: 'bush',
  },
  sunset: {
    golfer: 'meadow',
    leaves: { G: '#5b6b33', L: '#86924a', D: '#3c4824', T: '#4a2d1c' },
    tree: 'oak',
    hills: ['#c98a7a', '#8d6a4a'],
    sky: { kind: 'sun', x: 0.7, y: 112, colors: { Y: '#ffe08a', y: '#ff9f5a' } },
    clouds: '#ffd9b3',
    decor: 'flowers',
  },
  moon: {
    golfer: 'space',
    hills: ['#353d4f', '#4a5263'],
    sky: { kind: 'earth', x: 0.78, y: 46 },
    stars: true,
    props: 'lander',
    decor: 'rock',
  },
  moonrise: {
    golfer: 'space',
    hills: ['#3d4760', '#525c70'],
    sky: { kind: 'earth', x: 0.25, y: 120 },
    stars: true,
    props: 'lander',
    decor: 'rock',
  },
  eclipse: {
    golfer: 'space',
    hills: ['#2e2840', '#3d3a4a'],
    sky: { kind: 'eclipse', x: 0.72, y: 52 },
    stars: true,
    props: 'lander',
    decor: 'rock',
  },
  // Course Pass courses. Treeless recipes get the smooth rolling hill profile.
  dune: {
    golfer: 'meadow',
    hills: ['#e2b46a', '#c99449'],
    sky: { kind: 'sun', x: 0.8, y: 34, colors: { Y: '#fff7c2', y: '#ffd166' } },
    decor: 'rock',
  },
  mirage: {
    golfer: 'meadow',
    hills: ['#efcf8a', '#d5a95e'],
    sky: { kind: 'sun', x: 0.5, y: 28, colors: { Y: '#ffffff', y: '#fff1a8' } },
    decor: 'rock',
  },
  dusk: {
    golfer: 'meadow',
    hills: ['#8a4f5e', '#9c6a46'],
    sky: { kind: 'sun', x: 0.3, y: 118, colors: { Y: '#ffd38a', y: '#ff7b54' } },
    stars: true,
    decor: 'rock',
  },
  frost: {
    golfer: 'meadow',
    leaves: { G: '#dbe9f1', L: '#ffffff', D: '#8fb3c7', T: '#5a3a22' },
    tree: 'pine',
    hills: ['#c9dfeb', '#a9c7d8'],
    sky: { kind: 'sun', x: 0.85, y: 40, colors: { Y: '#ffffff', y: '#fff4c2' } },
    clouds: '#ffffff',
    decor: 'bush',
  },
  aurora: {
    golfer: 'meadow',
    leaves: { G: '#2c5a5f', L: '#4f8a85', D: '#173a40', T: '#3a2a1c' },
    tree: 'pine',
    hills: ['#1f4a5c', '#2f6070'],
    sky: null,
    stars: true,
    decor: 'bush',
  },
  blizzard: {
    golfer: 'meadow',
    leaves: { G: '#e4ecf2', L: '#ffffff', D: '#a3b5c2', T: '#5a3a22' },
    tree: 'pine',
    hills: ['#b7c3cd', '#9aa9b5'],
    sky: null,
    clouds: '#eef2f5',
    decor: 'bush',
  },
  ember: {
    golfer: 'meadow',
    hills: ['#5c1f12', '#3a1a14'],
    sky: { kind: 'sun', x: 0.75, y: 70, colors: { Y: '#ffb347', y: '#ff5e1a' } },
    decor: 'rock',
  },
  ash: {
    golfer: 'meadow',
    hills: ['#6b6460', '#55504c'],
    sky: null,
    clouds: '#9c9590',
    decor: 'rock',
  },
  magma: {
    golfer: 'meadow',
    hills: ['#3b1208', '#5a1a0a'],
    sky: { kind: 'sun', x: 0.6, y: 96, colors: { Y: '#ffd166', y: '#ef4444' } },
    stars: true,
    decor: 'rock',
  },
}

function tileFor(rows, palette) {
  return buildSprite(rows, palette, PX)
}

export function buildCourseSprites(themeId, theme) {
  const recipe = SCENERY[themeId] || SCENERY.morning
  const isMoon = recipe.golfer === 'space'
  const flagPalette = { P: '#f2f2f2', p: '#9a9a9a', F: theme.flag, f: shade(theme.flag, -0.35) }

  const sprites = {
    recipe,
    ball: buildSprite(BALL, { W: '#ffffff', L: '#c9d0da' }, PX),
    flag: [buildSprite(FLAG_A, flagPalette, PX), buildSprite(FLAG_B, flagPalette, PX)],
    fairwayTile: tileFor(isMoon ? MOON_TILE : GRASS_TILE, {
      G: theme.fairway,
      g: shade(theme.fairway, isMoon ? -0.12 : 0.18),
      l: shade(theme.fairway, 0.25),
    }),
    groundTile: tileFor(DIRT_TILE, { D: theme.ground, d: shade(theme.ground, -0.18) }),
  }

  if (recipe.clouds) {
    sprites.cloud = buildSprite(CLOUD, { W: recipe.clouds, S: shade(recipe.clouds, -0.12) }, PX)
  }
  if (recipe.sky?.kind === 'sun') sprites.skyBody = buildSprite(SUN, recipe.sky.colors, PX)
  if (recipe.sky?.kind === 'earth') {
    sprites.skyBody = buildSprite(EARTH, { B: '#3d7fd6', b: '#264f8f', G: '#58b368', W: '#f2f6fb' }, PX)
  }
  if (recipe.sky?.kind === 'eclipse') {
    sprites.skyBody = buildSprite(ECLIPSE, { C: '#f0abfc', c: '#fde4ff', k: '#05060c' }, PX)
  }

  if (recipe.tree) {
    sprites.tree = buildSprite(recipe.tree === 'pine' ? PINE : OAK, recipe.leaves, PX)
    sprites.treeFar = buildSprite(recipe.tree === 'pine' ? PINE : OAK, recipe.leaves, 2)
  }
  if (recipe.props === 'lander') {
    sprites.prop = buildSprite(LANDER, { O: '#1b1e2b', G: '#9aa3b5', W: '#d9f2ff', Y: '#e7b442', y: '#b9842a', L: '#c7ccd6' }, PX)
  }
  if (recipe.decor === 'flowers') {
    sprites.decor = buildSprite(FLOWERS, { F: '#ffffff', Y: '#ffd23f', G: shade(theme.fairway, -0.25) }, PX)
  }
  if (recipe.decor === 'bush') sprites.decor = buildSprite(BUSH, recipe.leaves, PX)
  if (recipe.decor === 'rock') {
    sprites.decor = buildSprite(ROCK, { R: '#8a91a0', r: '#b4bac6', D: '#4b515e' }, PX)
    sprites.crater = buildSprite(CRATER, { L: shade(theme.fairway, 0.2), D: shade(theme.fairway, -0.2), d: shade(theme.fairway, -0.35) }, PX)
  }

  return sprites
}
