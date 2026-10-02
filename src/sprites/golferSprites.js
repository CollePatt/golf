import { buildSprite, makeCanvas, pixelLine } from './pixelSprite.js'

// The golfer is composited each frame from a static body (head, torso, legs)
// plus arms and a club drawn as pixel lines, so the swing can sweep smoothly
// through any angle while staying on the pixel grid.

export const GOLFER_W = 36
export const GOLFER_H = 30
const BODY_X = 6
const LEGS_H = 9
const UPPER_TOP = GOLFER_H - LEGS_H - 14
// Front shoulder, in frame pixels
const SHOULDER = { x: BODY_X + 7, y: UPPER_TOP + 9 }
const ARM_LEN = 5
const CLUB_LEN = 13

const UPPER_CAP = [
  '....OOOO....',
  '...ORRRRO...',
  '...ORRRRROO.',
  '...ORRRRRRRO',
  '...OHSSSSOO.',
  '...OHSSSES..',
  '...OSSSSSO..',
  '....OSSSO...',
  '...OWWWWWO..',
  '..OWWWWWWWO.',
  '..OWAWWWWWO.',
  '..OWAWWWWWO.',
  '..OWWWWWWWO.',
  '...OBBBBBO..',
]

const UPPER_HELMET = [
  '...OOOOOO...',
  '..OWWWWWWO..',
  '.OWWWWVVVVO.',
  '.OWWWVVvVVO.',
  '.OWWWVVVVVO.',
  '..OWWWWVVO..',
  '...OWWWWO...',
  '..OOOOOOOO..',
  '.OXOWWWWWO..',
  '.OXOWWWWWWO.',
  '.OXOWWRWWWO.',
  '.OXOWWWWWWO.',
  '..OOWWWWWWO.',
  '...OBBBBBO..',
]

const LEGS_STAND = [
  '...OPPPPPO..',
  '...OPPOPPO..',
  '...OPPOPPO..',
  '...OPPOPPO..',
  '...OPPOPPO..',
  '...OPPOPPO..',
  '...OPPOPPO..',
  '..OKKKOKKKO.',
  '..OOOOOOOOO.',
]

const LEGS_FINISH = [
  '...OPPPPPO..',
  '...OPPPPPO..',
  '....OPPPPO..',
  '....OPPOPO..',
  '....OPOOPPO.',
  '...OPPO.OPO.',
  '...OPO..OPO.',
  '...OKO..OKKKO',
  '...OO...OOOOO',
]

const LEGS_WALK_A = [
  '...OPPPPPO..',
  '...OPPOPPO..',
  '...OPPOPPO..',
  '..OPPO.OPPO.',
  '..OPPO.OPPO.',
  '.OPPO...OPPO',
  '.OPPO...OPPO',
  'OKKKO..OKKKO',
  'OOOOO..OOOOO',
]

const LEGS_WALK_B = [
  '...OPPPPPO..',
  '...OPPPPPO..',
  '...OPPPPO...',
  '....OPPPO...',
  '....OPPPO...',
  '....OPPPO...',
  '....OPPPO...',
  '...OKKKKKO..',
  '...OOOOOOO..',
]

const PALETTES = {
  meadow: {
    O: '#1d1b26', R: '#d83a3a', H: '#6b3d22', S: '#f2c28f', E: '#1d1b26',
    W: '#f7f4ea', A: '#d9d3c1', B: '#3a2f2a', P: '#c9b27c', K: '#2f2a35',
    sleeve: '#f7f4ea', skin: '#f2c28f', shaft: '#c7ccd6', head: '#5b6170',
  },
  space: {
    O: '#1b1e2b', W: '#eef1f6', V: '#e7b442', v: '#fff3c4', X: '#9aa3b5',
    R: '#e04848', B: '#5d6577', P: '#dfe3ea', K: '#5d6577',
    sleeve: '#eef1f6', skin: '#c9ced9', shaft: '#c7ccd6', head: '#7dd3fc',
  },
}

const lerp = (a, b, t) => a + (b - a) * t
const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

// Swing keyframes: arm angle and absolute club angle, in degrees.
// 0 points straight down, positive rotates toward the target (screen right).
const ADDRESS = { arm: 8, club: 48 }
const TOP = { arm: -140, club: -250 }
const FINISH = { arm: 205, club: 290 }

export const SWING_BACK_MS = 220
export const SWING_DOWN_MS = 90
export const SWING_IMPACT_MS = SWING_BACK_MS + SWING_DOWN_MS
export const SWING_FINISH_MS = SWING_IMPACT_MS + 170

export function swingPose(elapsed) {
  if (elapsed == null) return { ...ADDRESS, legs: 'stand' }
  if (elapsed < SWING_BACK_MS) {
    const t = easeInOut(elapsed / SWING_BACK_MS)
    return { arm: lerp(ADDRESS.arm, TOP.arm, t), club: lerp(ADDRESS.club, TOP.club, t), legs: 'stand' }
  }
  if (elapsed < SWING_IMPACT_MS) {
    const t = ((elapsed - SWING_BACK_MS) / SWING_DOWN_MS) ** 2
    return { arm: lerp(TOP.arm, ADDRESS.arm, t), club: lerp(TOP.club, ADDRESS.club, t), legs: 'stand' }
  }
  const t = 1 - (1 - Math.min(1, (elapsed - SWING_IMPACT_MS) / (SWING_FINISH_MS - SWING_IMPACT_MS))) ** 2
  return { arm: lerp(ADDRESS.arm, FINISH.arm, t), club: lerp(ADDRESS.club, FINISH.club, t), legs: t > 0.25 ? 'finish' : 'stand' }
}

export function walkPose(ts) {
  const step = Math.floor(ts / 110) % 2
  return { arm: step ? 14 : -6, club: step ? 175 : 160, legs: step ? 'walkA' : 'walkB', carry: true }
}

export function createGolferRenderer(variant = 'meadow') {
  const palette = PALETTES[variant] || PALETTES.meadow
  const upper = buildSprite(variant === 'space' ? UPPER_HELMET : UPPER_CAP, palette)
  const legs = {
    stand: buildSprite(LEGS_STAND, palette),
    finish: buildSprite(LEGS_FINISH, palette),
    walkA: buildSprite(LEGS_WALK_A, palette),
    walkB: buildSprite(LEGS_WALK_B, palette),
  }
  const { canvas, ctx } = makeCanvas(GOLFER_W, GOLFER_H)

  return function renderGolfer(pose) {
    ctx.clearRect(0, 0, GOLFER_W, GOLFER_H)
    const legSprite = legs[pose.legs] || legs.stand
    const bob = pose.legs === 'walkB' ? -1 : 0
    ctx.drawImage(legSprite, BODY_X, GOLFER_H - LEGS_H)
    ctx.drawImage(upper, BODY_X, UPPER_TOP + bob)

    const rad = d => (d * Math.PI) / 180
    const sx = SHOULDER.x
    const sy = SHOULDER.y + bob
    const hx = sx + Math.sin(rad(pose.arm)) * ARM_LEN
    const hy = sy + Math.cos(rad(pose.arm)) * ARM_LEN
    const clubLen = pose.carry ? 9 : CLUB_LEN
    const cx = hx + Math.sin(rad(pose.club)) * clubLen
    const cy = hy + Math.cos(rad(pose.club)) * clubLen

    pixelLine(ctx, hx, hy, cx, cy, palette.shaft)
    ctx.fillStyle = palette.head
    ctx.fillRect(Math.round(cx) - 1, Math.round(cy), 3, 1)
    pixelLine(ctx, sx, sy, hx, hy, palette.sleeve)
    ctx.fillStyle = palette.skin
    ctx.fillRect(Math.round(hx), Math.round(hy), 1, 1)
    return canvas
  }
}

// Where the club head rests at address, in frame pixels; used to line the
// golfer up behind the ball.
export function addressClubHead() {
  const rad = d => (d * Math.PI) / 180
  const hx = SHOULDER.x + Math.sin(rad(ADDRESS.arm)) * ARM_LEN
  const hy = SHOULDER.y + Math.cos(rad(ADDRESS.arm)) * ARM_LEN
  return {
    x: Math.round(hx + Math.sin(rad(ADDRESS.club)) * CLUB_LEN),
    y: Math.round(hy + Math.cos(rad(ADDRESS.club)) * CLUB_LEN),
  }
}
