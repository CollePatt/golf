import { paintRows } from './pixelSprite.js'

// Seed art for the ball and pickup sheets. scripts/generate-sprite-sheets.mjs
// runs these once to produce editable .aseprite files; after that the sheets
// themselves are the source of truth.

export const BALL_CELL = { w: 12, h: 8 }
// The ball body sits on the right of its cell; the left is room for trails.
export const BALL_CENTER = { x: 8, y: 4 }
export const PICKUP_CELL = { w: 12, h: 12 }

function ballMask(lx, y) {
  const d = Math.hypot(lx + 0.5 - 4, y + 0.5 - 4)
  if (d <= 3.1) return 'body'
  if (d <= 4.1) return 'edge'
  return null
}

function drawBallBody(ctx, pal, frame, ox = 4, oy = 0, pattern = 'dimples') {
  for (let y = 0; y < 8; y++) {
    for (let lx = 0; lx < 8; lx++) {
      const m = ballMask(lx, y)
      if (!m) continue
      let c = pal.edge
      if (m === 'body') {
        const light = lx + 0.5 - 4 + (y + 0.5 - 4)
        c = light > 1.5 ? pal.shade : light < -2.5 ? pal.hi : pal.base
        if (pattern === 'dimples' && c !== pal.hi && (lx * 3 + y * 2 + frame * 2) % 5 === 0) c = pal.dimple
        if (pattern === 'craters' && c !== pal.hi && ((lx + frame * 2) % 8 === 2 || (lx + frame * 2) % 8 === 3) && (y === 2 || y === 5 - (lx % 2))) c = pal.dimple
        if (pattern === 'stripes') {
          const band = pal.bands[(((lx - y + frame) % pal.bands.length) + pal.bands.length) % pal.bands.length]
          c = light > 1.5 ? pal.shade : light < -2.5 ? pal.hi : band
        }
      }
      ctx.fillStyle = c
      ctx.fillRect(ox + lx, oy + y, 1, 1)
    }
  }
}

function px(ctx, color, x, y) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, 1, 1)
}

export const BALL_DESIGNS = [
  {
    name: 'classic',
    frames: 4,
    duration: 90,
    draw(ctx, f) {
      drawBallBody(ctx, { edge: '#2b2f3a', base: '#ffffff', shade: '#c9d0da', hi: '#ffffff', dimple: '#dde3ea' }, f)
    },
  },
  {
    name: 'gold',
    frames: 4,
    duration: 110,
    draw(ctx, f) {
      drawBallBody(ctx, { edge: '#5a3a0a', base: '#ffd23f', shade: '#d99a1c', hi: '#fff6c2', dimple: '#f0b92b' }, f)
      const glints = [[6, 2], [9, 3], null, [3, 1]]
      const g = glints[f]
      if (g) {
        px(ctx, '#ffffff', g[0], g[1])
        px(ctx, '#fff6c2', g[0] - 1, g[1]); px(ctx, '#fff6c2', g[0] + 1, g[1])
        px(ctx, '#fff6c2', g[0], g[1] - 1); px(ctx, '#fff6c2', g[0], g[1] + 1)
      }
    },
  },
  {
    name: 'fire',
    frames: 4,
    duration: 70,
    draw(ctx, f) {
      const lengths = [[3, 4, 2, 3], [4, 2, 4, 2], [2, 4, 3, 4], [4, 3, 2, 3]][f]
      const colors = ['#ffe066', '#ff9a2e', '#e8431c', '#a8200f']
      lengths.forEach((len, row) => {
        for (let i = 0; i < len; i++) px(ctx, colors[Math.min(3, i)], 4 - i, 2 + row)
      })
      drawBallBody(ctx, { edge: '#5a1408', base: '#ff7a1a', shade: '#d43a12', hi: '#ffe066', dimple: '#ffb03a' }, f)
    },
  },
  {
    name: 'ice',
    frames: 4,
    duration: 120,
    draw(ctx, f) {
      const flakes = [[[1, 2], [3, 5]], [[0, 4], [2, 1]], [[2, 6], [1, 3]], [[3, 2], [0, 5]]][f]
      flakes.forEach(([x, y]) => px(ctx, '#e8f8ff', x, y))
      drawBallBody(ctx, { edge: '#1d3f63', base: '#bfe9ff', shade: '#6fb6e8', hi: '#ffffff', dimple: '#9fd6f5' }, f)
    },
  },
  {
    name: 'lunar',
    frames: 4,
    duration: 120,
    draw(ctx, f) {
      drawBallBody(ctx, { edge: '#1b1e2b', base: '#b4bac6', shade: '#7d8494', hi: '#e3e7ee', dimple: '#8a91a0' }, f, 4, 0, 'craters')
    },
  },
  {
    name: 'prism',
    frames: 4,
    duration: 80,
    draw(ctx, f) {
      const bands = ['#ff5d5d', '#ffb23f', '#ffe45c', '#5fd38a', '#5ab8ff', '#a87bff']
      for (let row = 0; row < 2; row++) {
        for (let i = 0; i < 2; i++) px(ctx, bands[(row * 2 + i + f) % bands.length], 3 - i * 2, 3 + row)
      }
      drawBallBody(ctx, { edge: '#2b1a3a', shade: '#7a5aa8', hi: '#ffffff', bands }, f, 4, 0, 'stripes')
    },
  },
]

const STAR = [
  '.....O.....',
  '....OWO....',
  '....OYO....',
  '...OYYYO...',
  'OOOOYYYOOOO',
  'OWYYYYYYYyO',
  '.OYYYYYYyO.',
  '..OYYYYyO..',
  '..OYYOyyO..',
  '.OYyO.OyyO.',
  '.OOO...OOO.',
]

const CLOVER = [
  '..OO..OO....',
  '.OGGOOGGO...',
  '.OGLGGLGO...',
  '..OGGGGO....',
  'OO.OGGO.OO..',
  'GGOOGGOOGGO.',
  'GLGGGGGGLGO.',
  'OGGGOOGGGO..',
  '.OOO.SOOO...',
  '.....S......',
  '......S.....',
  '......S.....',
]

const MAGNET = [
  '..OOOOOOOO..',
  '.ORRRRRRRRO.',
  'ORRrOOOOrRRO',
  'ORRO....ORRO',
  'ORRO....ORRO',
  'ORRO....ORRO',
  'OWWO....OWWO',
  'OSSO....OSSO',
  'OOOO....OOOO',
]

export const PICKUPS = [
  {
    name: 'coin',
    frames: 4,
    duration: 120,
    draw(ctx, f) {
      const half = [4.6, 3, 1, 3][f]
      for (let y = 0; y < 11; y++) {
        for (let x = 0; x < 12; x++) {
          const dx = (x + 0.5 - 6) / (half + 0.6)
          const dy = (y + 0.5 - 5.5) / 5.4
          const d = dx * dx + dy * dy
          if (d > 1) continue
          const edge = d > 0.62 || half < 1.5
          ctx.fillStyle = d > 0.85 ? '#5a3a0a' : edge ? (x < 6 ? '#ffe680' : '#d99a1c') : '#ffd23f'
          ctx.fillRect(x, y, 1, 1)
        }
      }
      if (f === 0) {
        ;[[5, 3], [5, 4], [5, 5], [5, 6], [5, 7], [6, 3], [6, 7]].forEach(([x, y]) => px(ctx, '#b07a12', x, y))
      }
    },
  },
  {
    name: 'star',
    frames: 4,
    duration: 140,
    draw(ctx, f) {
      paintRows(ctx, STAR, { O: '#5a3a0a', Y: '#ffd23f', y: '#e8a21c', W: '#fff6c2' }, 0, 1)
      const sparks = [[[11, 0]], [[0, 1], [11, 9]], [[10, 2]], []][f]
      sparks.forEach(([x, y]) => px(ctx, '#ffffff', x, y))
    },
  },
  {
    name: 'clover',
    frames: 4,
    duration: 160,
    draw(ctx, f) {
      const sway = [0, 0, 1, 0][f]
      paintRows(ctx, CLOVER, { O: '#1b4a31', G: '#4caf50', L: '#9be08f', S: '#2f6a32' }, sway, 0)
    },
  },
  {
    name: 'tailwind',
    frames: 4,
    duration: 100,
    draw(ctx, f) {
      const rows = [[3, 7, '#ffffff'], [6, 9, '#d9f2ff'], [9, 6, '#ffffff']]
      rows.forEach(([y, len, color], i) => {
        const start = (f * 2 + i * 3) % 6
        for (let x = 0; x < len; x++) px(ctx, color, (start + x) % 12, y)
        const tip = (start + len) % 12
        px(ctx, color, tip, y - 1)
        px(ctx, color, (tip + 1) % 12, y - 2)
        px(ctx, '#7fb8d9', (start + len - 1) % 12, y + 1)
      })
    },
  },
  {
    name: 'extraBall',
    frames: 4,
    duration: 150,
    draw(ctx, f) {
      drawBallBody(ctx, { edge: '#2b2f3a', base: '#ffffff', shade: '#c9d0da', hi: '#ffffff', dimple: '#dde3ea' }, 0, 0, 4)
      const plus = f % 2 ? '#7be08a' : '#2fa84f'
      ;[[9, 0], [9, 1], [9, 2], [9, 3], [9, 4], [7, 2], [8, 2], [10, 2], [11, 2]].forEach(([x, y]) => px(ctx, plus, x, y))
    },
  },
  {
    name: 'magnet',
    frames: 4,
    duration: 120,
    draw(ctx, f) {
      paintRows(ctx, MAGNET, { O: '#2a1b1f', R: '#e04848', r: '#ff8a8a', W: '#f2f2f2', S: '#b7bcc6' }, 0, 1)
      const sparks = [[[1, 10], [10, 11]], [[2, 11], [9, 10]], [[1, 11], [10, 10]], [[2, 10], [9, 11]]][f]
      sparks.forEach(([x, y]) => px(ctx, '#ffe066', x, y))
    },
  },
]
