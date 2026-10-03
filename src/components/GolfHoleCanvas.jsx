import { useRef, useEffect, useMemo } from 'react'
import { spritesSupported } from '../sprites/pixelSprite.js'
import { buildCourseSprites, PX } from '../sprites/courseSprites.js'
import { drawSpriteScenery, drawSpriteGround } from '../sprites/sceneryRenderer.js'
import {
  createGolferRenderer,
  addressClubHead,
  swingPose,
  walkPose,
  GOLFER_W,
  GOLFER_H,
  SWING_IMPACT_MS,
  SWING_FINISH_MS,
} from '../sprites/golferSprites.js'
import { SHEETS, requestSheets } from '../sprites/sheets.js'

const SCALE = 4
const H = 240
const GROUND_Y = 178
const BALL_R = 6
const ARC_H = 88
const ANIM_MS = 680
const CAM_LERP = 0.09
// Sprite mode leaves room left of the tee so the golfer is on screen.
const TEE_PAD = 96
const BALL_SHEET_SCALE = 2

function loadSprites(themeId, theme) {
  if (!spritesSupported()) return null
  try {
    const course = buildCourseSprites(themeId, theme)
    return {
      ...course,
      renderGolfer: createGolferRenderer(course.recipe.golfer),
      clubHead: addressClubHead(),
    }
  } catch (err) {
    console.warn('Sprite build failed, using flat renderer', err)
    return null
  }
}

function easeOut(t) {
  return 1 - (1 - t) * (1 - t)
}

const PICKUP_SHEET_SCALE = 2
const PICKUP_FLOAT = 46
const PICKUP_POP_MS = 520
const PICKUP_COLORS = {
  coin: '#ffd23f',
  star: '#fff1a8',
  clover: '#4caf50',
  tailwind: '#d9f2ff',
  extraBall: '#ffffff',
  magnet: '#e04848',
}

const INK = '#0f130e'
const LABEL_FONT = '13px "DotGothic16", system-ui, sans-serif'
const STAMP_FONT = '"Press Start 2P", ui-monospace, monospace'

// Hazards are drawn as pixel pools (water) or traps (bunker); each course
// picks a look in courses.js. top is the surface row, deep the bottom.
const HAZARD_LOOKS = {
  water: { pool: true, top: '#bfe3ff', body: '#3d82d6', deep: '#29599e' },
  coolant: { pool: true, top: '#c8fff6', body: '#2bb8a7', deep: '#167d72' },
  oasis: { pool: true, top: '#b6f2e3', body: '#2a9d8f', deep: '#1c6b62' },
  meltwater: { pool: true, top: '#f0faff', body: '#7cc3ea', deep: '#4b8fbe' },
  lava: { pool: true, top: '#ffe066', body: '#f2661b', deep: '#a8230e' },
  sand: { pool: false, top: '#f6e2b0', body: '#e4c58d', deep: '#b48f55' },
  dune: { pool: false, top: '#f8d891', body: '#e2ad59', deep: '#a8752f' },
  crater: { pool: false, top: '#cfd4dd', body: '#8b92a1', deep: '#525866' },
  snow: { pool: false, top: '#ffffff', body: '#d2e4f1', deep: '#86a8c2' },
  ash: { pool: false, top: '#8f8882', body: '#5f5853', deep: '#37312d' },
}

const STAMP_COLORS = {
  great: '#f6c445',
  good: '#8fe39b',
  plain: '#f3edd3',
  weak: '#c3cdb0',
  bad: '#ff9b8a',
}

const STAMP_MS = 1300
const SPLASH_HIDE_MS = 420
const HOP_MS = 300
const ROLL_MS = 380
const STEP_MS = 50

function snap(v) {
  return Math.round(v / PX) * PX
}

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

// Ink tag with pixel text, used for hazard names and the hole trait.
function drawTag(ctx, parts, x, y, align = 'center') {
  ctx.font = LABEL_FONT
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  const gap = 6
  const widths = parts.map(part => ctx.measureText(part.text).width)
  const w = Math.round(widths.reduce((a, b) => a + b, 0) + gap * (parts.length - 1) + 12)
  const left = Math.round(align === 'center' ? x - w / 2 : x)
  ctx.fillStyle = INK
  ctx.fillRect(left, y - 9, w, 18)
  let cursor = left + 6
  parts.forEach((part, index) => {
    ctx.fillStyle = part.color
    ctx.fillText(part.text, cursor, y + 1)
    cursor += widths[index] + gap
  })
  ctx.textBaseline = 'alphabetic'
}

// Stepped shape sunk into the fairway. Rows shrink inward to fake a rounded
// bottom; an ink pass one pixel wider goes down first as the outline.
function drawHazardShape(ctx, look, x0, x1, ts, still) {
  const rows = look.pool
    ? [[0, look.top, 1], [0, look.body, 2], [1, look.body, 1], [2, look.deep, 1], [4, look.deep, 1]]
    : [[0, look.top, 1], [1, look.body, 2], [2, look.body, 1], [4, look.deep, 1]]
  let y = GROUND_Y
  const shapes = rows.map(([inset, color, h]) => {
    const shape = { x: x0 + inset * PX, w: x1 - x0 - inset * PX * 2, y, h: h * PX, color }
    y += h * PX
    return shape
  })
  // No ink along the top edge, so it reads as cut into the fairway.
  ctx.fillStyle = INK
  for (const s of shapes) ctx.fillRect(s.x - PX, s.y, s.w + PX * 2, s.h + PX)
  for (const s of shapes) {
    if (s.w <= 0) continue
    ctx.fillStyle = s.color
    ctx.fillRect(s.x, s.y, s.w, s.h)
  }
  const width = x1 - x0
  if (look.pool) {
    // Two-frame ripple on the surface.
    const frame = still ? 0 : Math.floor(ts / 450) % 2
    ctx.fillStyle = look.top
    for (let x = x0 + PX * (2 + frame * 2); x < x1 - PX * 3; x += PX * 8) {
      ctx.fillRect(x, GROUND_Y + PX * 2, PX * 2, PX)
    }
  } else {
    // Fixed grain so the trap reads as loose ground, not a stripe.
    ctx.fillStyle = look.deep
    for (let i = 0; i < width / (PX * 4); i++) {
      const gx = x0 + PX * 2 + ((i * 7) % Math.max(1, Math.floor(width / PX) - 4)) * PX
      ctx.fillRect(gx, GROUND_Y + PX * (i % 2 === 0 ? 2 : 3), PX, PX)
    }
  }
}

// Short-lived pixel particles for landings. Positions snap to the sprite grid
// and advance in steps, matching the stepped UI animation.
function spawnBurst(list, ts, x, y, colors, count, { speed = 0.12, lift = 0.22, gravity = 0.0006, life = 520 } = {}) {
  for (let i = 0; i < count; i++) {
    const spread = (i / Math.max(1, count - 1)) * 2 - 1
    list.push({
      x,
      y,
      vx: spread * speed + (Math.random() - 0.5) * 0.04,
      vy: -lift * (0.6 + Math.random() * 0.5),
      gravity,
      born: ts,
      life,
      color: colors[i % colors.length],
    })
  }
}

export default function GolfHoleCanvas({
  yardsThisRun,
  targetDistance,
  holeKey,
  approachDistance = 120,
  hazards = [],
  pickups = null,
  pickupRadius = 0,
  shot = null,
  trait = null,
  onShotSettled,
  theme,
  themeId,
  ballStyle = 'classic',
  useSprites = true,
}) {
  const canvasRef = useRef(null)
  const sprites = useMemo(
    () => (useSprites ? loadSprites(themeId, theme) : null),
    [useSprites, themeId, theme],
  )
  useEffect(() => {
    if (useSprites) requestSheets()
  }, [useSprites])
  const rafRef = useRef(null)
  const prevYardsRef = useRef(0)
  const hazardsRef = useRef(hazards)
  hazardsRef.current = hazards
  const pickupsRef = useRef({ pickups, pickupRadius, yardsThisRun })
  pickupsRef.current = { pickups, pickupRadius, yardsThisRun }
  const traitRef = useRef(trait)
  traitRef.current = trait
  const onSettledRef = useRef(onShotSettled)
  onSettledRef.current = onShotSettled
  const lastShotKeyRef = useRef(shot?.key ?? null)
  // id -> timestamp the pop animation started, per hole.
  const popsRef = useRef({ key: null, starts: {} })

  const r = useRef({
    ballVX: 0,
    cameraX: 0,
    isAnim: false,
    animFrom: 0,
    animTo: 0,
    animStart: null,
    swingStart: null,
    golferX: 0,
    walkFrom: 0,
    walkStart: null,
    plan: null,
    inCup: false,
    particles: [],
    trail: [],
    stamp: null,
  })

  // Main render loop — runs once on mount, restarts if targetDistance changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = canvas.offsetWidth
    canvas.height = H

    // Swing timing comes from the Aseprite sheet when it has loaded: the
    // 'swing' tag ends at impact and the 'follow' tag runs to the finish.
    function golferTiming() {
      const sheet = sprites && SHEETS[sprites.recipe.golfer]
      if (!sheet) return { sheet: null, impactMs: SWING_IMPACT_MS, finishMs: SWING_FINISH_MS }
      const impactMs = sheet.tagDuration('swing')
      return { sheet, impactMs, finishMs: impactMs + sheet.tagDuration('follow') }
    }

    // Golfer stands at the ball's last lie, swings, holds the finish while the
    // ball flies, then walks up to where it landed.
    function drawGolfer(ctx, st, ts, cam) {
      const { sheet, impactMs, finishMs } = golferTiming()
      let mode = 'idle'
      const swingElapsed = st.swingStart == null ? null : ts - st.swingStart
      const holding = st.isAnim || (st.landedAt != null && ts - st.landedAt < 220)
      if (swingElapsed != null && (holding || swingElapsed < finishMs)) {
        st.walkStart = null
        mode = 'swing'
      } else if (Math.abs(st.golferX - st.ballVX) > 1) {
        st.swingStart = null
        if (st.walkStart == null) {
          st.walkStart = ts
          st.walkFrom = st.golferX
          st.walkDur = Math.max(320, Math.min(1100, Math.abs(st.ballVX - st.golferX) * 1.2))
        }
        const t = Math.min(1, (ts - st.walkStart) / st.walkDur)
        st.golferX = st.walkFrom + (st.ballVX - st.walkFrom) * t
        if (t >= 1) {
          st.golferX = st.ballVX
          st.walkStart = null
        }
        mode = 'walk'
      } else {
        st.swingStart = null
      }

      const anchor = sheet?.slices.ball || { x: sprites.clubHead.x + 2, y: GOLFER_H - 2 }
      const cell = sheet?.cell || { w: GOLFER_W, h: GOLFER_H }
      const x = Math.round(st.golferX - cam - anchor.x * PX)
      const y = GROUND_Y - anchor.y * PX
      if (x < -cell.w * PX || x > canvas.width) return
      ctx.fillStyle = 'rgba(0,0,0,0.2)'
      ctx.beginPath()
      ctx.ellipse(x + (anchor.x - 13) * PX, GROUND_Y + 3, 7 * PX, PX, 0, 0, Math.PI * 2)
      ctx.fill()

      if (sheet) {
        let frame
        if (mode === 'swing') {
          frame = swingElapsed < impactMs
            ? sheet.frameAt('swing', swingElapsed, false)
            : sheet.frameAt('follow', swingElapsed - impactMs, false)
        } else {
          frame = sheet.frameAt(mode, ts)
        }
        sheet.draw(ctx, frame, x, y, PX)
        return
      }
      const pose = mode === 'swing' ? swingPose(swingElapsed) : mode === 'walk' ? walkPose(ts) : swingPose(null)
      ctx.drawImage(sprites.renderGolfer(pose), x, y, GOLFER_W * PX, GOLFER_H * PX)
    }

    // Pickups float over the fairway with a faint ring showing how close the
    // ball has to stop. A collected one stays until the ball lands, then pops.
    function drawPickups(ctx, st, ts, cam, W) {
      const { pickups: hole, pickupRadius: radius, yardsThisRun: restYards } = pickupsRef.current
      if (!hole) return
      const pops = popsRef.current
      if (pops.key !== hole.key) {
        pops.key = hole.key
        pops.starts = {}
        for (const item of hole.items) if (item.collected) pops.starts[item.id] = -Infinity
      }
      const sheet = sprites && SHEETS.pickups
      for (const item of hole.items) {
        const x = item.at * SCALE - cam
        if (x < -40 || x > W + 40) continue
        let lift = 0
        let alpha = 1
        if (item.collected) {
          // The swing that collected it may not have started animating yet.
          const settled = !st.isAnim && prevYardsRef.current === restYards
          if (pops.starts[item.id] == null && settled) pops.starts[item.id] = ts
          const start = pops.starts[item.id]
          if (start != null) {
            const t = (ts - start) / PICKUP_POP_MS
            if (t >= 1) continue
            lift = t * 26
            alpha = 1 - t
          }
        } else if (radius > 0) {
          const rx = Math.max(6, radius * SCALE)
          ctx.fillStyle = 'rgba(255, 246, 194, 0.22)'
          ctx.strokeStyle = 'rgba(255, 246, 194, 0.75)'
          ctx.lineWidth = 1.5
          ctx.setLineDash([4, 4])
          ctx.beginPath()
          ctx.ellipse(x, GROUND_Y + 3, rx, 4, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
          ctx.setLineDash([])
          // Tether from the ring up to the floating pickup.
          ctx.strokeStyle = 'rgba(255, 246, 194, 0.35)'
          ctx.beginPath()
          ctx.moveTo(x, GROUND_Y)
          ctx.lineTo(x, GROUND_Y - PICKUP_FLOAT + 14)
          ctx.stroke()
        }

        const bob = Math.sin(ts / 320 + item.id * 1.7) * 3
        const y = GROUND_Y - PICKUP_FLOAT + bob - lift
        ctx.globalAlpha = alpha
        // Dark halo so light sprites read against the sky.
        ctx.fillStyle = 'rgba(16, 32, 24, 0.35)'
        ctx.beginPath()
        ctx.arc(x, y, 15, 0, Math.PI * 2)
        ctx.fill()
        if (sheet && sheet.tags[item.type]) {
          const frame = sheet.frameAt(item.type, ts + item.id * 90)
          const half = (sheet.cell.w * PICKUP_SHEET_SCALE) / 2
          sheet.draw(ctx, frame, x - half, y - half, PICKUP_SHEET_SCALE)
        } else {
          ctx.fillStyle = PICKUP_COLORS[item.type] || '#ffffff'
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(x, y, 8, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
        }
        ctx.globalAlpha = 1
      }
    }

    const reduceMotion = prefersReducedMotion()

    // The ball just came down: kick up the landing effect and stamp the result.
    function landShot(st, plan, ts) {
      if (plan.stamp) st.stamp = { ...plan.stamp, x: plan.landX, start: ts }
      if (reduceMotion) return
      const look = plan.look
      const at = [st.particles, ts, plan.landX, GROUND_Y - PX]
      if (plan.effect === 'splash' || plan.effect === 'skip') {
        const colors = look ? ['#ffffff', look.top, look.body] : ['#ffffff', '#bfe3ff', '#3d82d6']
        spawnBurst(...at, colors, plan.effect === 'splash' ? 12 : 6, { speed: 0.08, lift: 0.34 })
      } else if (plan.effect === 'sand') {
        const colors = look ? [look.top, look.body, look.deep] : ['#f6e2b0', '#e4c58d']
        spawnBurst(...at, colors, 10, { speed: 0.14, lift: 0.24 })
      } else {
        spawnBurst(...at, [theme.fairway, 'rgba(255,255,255,0.7)'], 4, { speed: 0.08, lift: 0.12, life: 360 })
      }
      if (plan.tone === 'great') {
        spawnBurst(...at, ['#f6c445', '#fff1a8'], 6, { speed: 0.12, lift: 0.3, gravity: 0.0004, life: 640 })
      }
    }

    function drawTrail(ctx, st, ts, cam) {
      if (!st.trail.length) return
      const fade = st.plan?.landed ? Math.max(0, 1 - (ts - st.plan.landed) / 500) : 1
      if (fade <= 0) {
        st.trail = []
        return
      }
      st.trail.forEach((point, index) => {
        ctx.globalAlpha = fade * (0.25 + 0.6 * (index / st.trail.length))
        ctx.fillStyle = index % 2 === 0 ? '#f6c445' : '#fff1a8'
        ctx.fillRect(snap(point.x - cam) - PX, snap(point.y) - PX, PX * 2, PX * 2)
      })
      ctx.globalAlpha = 1
    }

    function drawParticles(ctx, st, ts, cam) {
      st.particles = st.particles.filter(p => ts - p.born < p.life)
      for (const p of st.particles) {
        const a = Math.floor((ts - p.born) / STEP_MS) * STEP_MS
        const x = p.x + p.vx * a
        const y = p.y + p.vy * a + 0.5 * p.gravity * a * a
        ctx.fillStyle = p.color
        ctx.fillRect(snap(x - cam), snap(y), PX, PX)
      }
    }

    // Result word over the landing spot: pops in over three steps, rises a
    // few pixels, then fades. Still under reduced motion.
    function drawStamp(ctx, st, ts, cam, W) {
      const stamp = st.stamp
      if (!stamp) return
      const age = ts - stamp.start
      if (age > STAMP_MS) {
        st.stamp = null
        return
      }
      const step = Math.floor(age / 60)
      const scale = reduceMotion ? 1 : ([1.5, 1.25, 1.1][step] ?? 1)
      const lift = reduceMotion ? 0 : Math.min(4, Math.floor(age / 120)) * PX
      ctx.globalAlpha = age > STAMP_MS - 300 ? Math.ceil(((STAMP_MS - age) / 300) * 3) / 3 : 1
      const fontPx = Math.round(14 * scale)
      ctx.font = `${fontPx}px ${STAMP_FONT}`
      const half = Math.max(48, ctx.measureText(stamp.label).width / 2 + 10)
      const x = Math.max(half, Math.min(W - half, stamp.x - cam))
      const y = GROUND_Y - 72 - lift
      ctx.textAlign = 'center'
      ctx.lineJoin = 'miter'
      if (stamp.label) {
        ctx.lineWidth = 6
        ctx.strokeStyle = INK
        ctx.strokeText(stamp.label, x, y)
        ctx.fillStyle = STAMP_COLORS[stamp.tone] || STAMP_COLORS.plain
        ctx.fillText(stamp.label, x, y)
      }
      ctx.font = '15px "DotGothic16", system-ui, sans-serif'
      ctx.lineWidth = 4
      ctx.strokeStyle = INK
      const subY = stamp.label ? y + 20 : y
      ctx.strokeText(stamp.sub, x, subY)
      ctx.fillStyle = STAMP_COLORS.plain
      ctx.fillText(stamp.sub, x, subY)
      ctx.globalAlpha = 1
    }

    function draw(ts) {
      const ctx = canvas.getContext('2d')
      const W = canvas.width
      const vW = targetDistance * SCALE
      const st = r.current

      const pad = sprites ? TEE_PAD : 0

      // Advance the shot: flight to where the ball comes down, then whatever
      // happens after (a splash, a hop, a roll into the cup). In sprite mode
      // the ball waits for the club to reach impact before it launches.
      let ballY = GROUND_Y
      let ballVisible = !st.inCup
      if (st.isAnim && st.plan) {
        const plan = st.plan
        if (!st.animStart) {
          if (sprites) {
            if (st.swingStart == null) st.swingStart = ts
            st.animStart = st.swingStart + golferTiming().impactMs
          } else {
            st.animStart = ts
          }
        }
        const elapsed = ts - st.animStart
        const flightT = Math.max(0, Math.min(elapsed / plan.flightMs, 1))
        if (flightT < 1) {
          st.ballVX = plan.fromX + (plan.landX - plan.fromX) * easeOut(flightT)
          ballY = GROUND_Y - Math.sin(flightT * Math.PI) * plan.arcH
          if (plan.trail && !reduceMotion && elapsed > 0) {
            const last = st.trail[st.trail.length - 1]
            if (!last || ts - last.ts >= STEP_MS) st.trail.push({ x: st.ballVX, y: ballY, ts })
          }
        } else {
          if (!plan.landed) {
            plan.landed = ts
            landShot(st, plan, ts)
          }
          const after = elapsed - plan.flightMs
          if (plan.effect === 'splash') {
            const shown = after - SPLASH_HIDE_MS
            st.ballVX = shown < 0 ? plan.landX : plan.restX
            // Lost ball: gone in the splash, then blinks in at the drop.
            ballVisible = shown >= 0 && (reduceMotion || Math.floor(shown / 100) % 2 === 0)
          } else if (plan.settleMs > 0) {
            const t = Math.min(1, after / plan.settleMs)
            st.ballVX = plan.landX + (plan.restX - plan.landX) * (plan.effect === 'holed' ? t : easeOut(t))
            ballY = GROUND_Y - Math.sin(t * Math.PI) * plan.hopH
          }
          if (after >= plan.settleMs) {
            st.isAnim = false
            st.ballVX = plan.restX
            st.animStart = null
            st.landedAt = ts
            ballY = GROUND_Y
            if (plan.effect === 'holed') {
              st.inCup = true
              ballVisible = false
              if (!reduceMotion) spawnBurst(st.particles, ts, plan.restX, GROUND_Y - PX * 2, ['#f6c445', '#fff1a8', '#ffffff'], 8, { speed: 0.1, lift: 0.26 })
            }
            onSettledRef.current?.(plan.key)
          }
        }
      }

      // Smooth camera follow
      const targetCamX = Math.max(0, Math.min(vW + pad * 1.5 - W, st.ballVX + pad - W / 2))
      st.cameraX += (targetCamX - st.cameraX) * CAM_LERP
      const cam = st.cameraX - pad

      // Clear
      ctx.clearRect(0, 0, W, H)
      ctx.imageSmoothingEnabled = false

      // Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y)
      skyGrad.addColorStop(0, theme.skyTop)
      skyGrad.addColorStop(1, theme.skyBottom)
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, W, GROUND_Y)

      if (sprites) {
        drawSpriteScenery(ctx, { W, cam: st.cameraX, ts, groundY: GROUND_Y, sprites })
        drawSpriteGround(ctx, { W, H, cam: st.cameraX, groundY: GROUND_Y, sprites, theme })
      } else {
        // Ground body
        ctx.fillStyle = theme.ground
        ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y)

        // Fairway top stripe
        ctx.fillStyle = theme.fairway
        ctx.fillRect(0, GROUND_Y, W, 10)
      }

      // Approach zone near the pin
      const approachStartX = Math.max(0, (targetDistance - approachDistance) * SCALE - cam)
      const approachEndX = targetDistance * SCALE - cam
      if (approachEndX > 0 && approachStartX < W) {
        ctx.fillStyle = 'rgba(241, 213, 138, 0.18)'
        ctx.fillRect(approachStartX, GROUND_Y - 4, approachEndX - approachStartX, 18)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
        ctx.font = LABEL_FONT
        ctx.textAlign = 'center'
        const labelX = Math.max(44, Math.min(W - 44, approachStartX + 64))
        // Sits above the yardage markers so the two never overlap.
        ctx.fillText('APPROACH', labelX, GROUND_Y - 26)
      }

      // Fairway hazards
      for (const hazard of hazardsRef.current) {
        const look = HAZARD_LOOKS[hazard.look] || (hazard.type === 'water' ? HAZARD_LOOKS.water : HAZARD_LOOKS.sand)
        const startX = snap(hazard.start * SCALE - cam)
        const endX = snap(hazard.end * SCALE - cam)
        if (endX < 0 || startX > W) continue
        drawHazardShape(ctx, look, startX, endX, ts, reduceMotion)
        const labelX = Math.max(startX + 50, Math.min(endX - 50, W / 2))
        drawTag(ctx, [{ text: hazard.name, color: look.top }], labelX, GROUND_Y + 34)
      }

      // Hole trait, posted at the tee so it reads before the first swing.
      const holeTrait = traitRef.current
      if (holeTrait && -cam > -260 && -cam < W) {
        const pct = Math.round(((holeTrait.distanceMultiplier ?? 1) - 1) * 100)
        drawTag(ctx, [
          { text: holeTrait.label, color: STAMP_COLORS.plain },
          {
            text: pct > 0 ? `+${pct}%` : pct < 0 ? `${pct}%` : '±0%',
            color: pct > 0 ? STAMP_COLORS.good : pct < 0 ? STAMP_COLORS.bad : STAMP_COLORS.weak,
          },
        ], Math.round(-cam - (sprites ? 72 : 0)), GROUND_Y + 34, 'left')
      }

      // Yardage tick marks
      ctx.textAlign = 'center'
      ctx.font = LABEL_FONT
      for (let y = 25; y < targetDistance; y += 25) {
        const sx = y * SCALE - cam
        if (sx < -10 || sx > W + 10) continue
        const isMajor = y % 50 === 0
        ctx.strokeStyle = isMajor ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.35)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(sx, GROUND_Y - (isMajor ? 8 : 4))
        ctx.lineTo(sx, GROUND_Y)
        ctx.stroke()
        if (isMajor) {
          ctx.fillStyle = '#000'
          ctx.fillText(`${y}`, sx, GROUND_Y - 11)
        }
      }

      // Flagstick — drawn at the actual hole position, or pinned to the right
      // edge of the screen with a remaining-yards label when the hole is offscreen.
      const flagSX = targetDistance * SCALE - cam
      const flagOnscreen = flagSX > -20 && flagSX < W + 20
      const drawFlag = (x, alpha = 1) => {
        ctx.globalAlpha = alpha
        ctx.strokeStyle = '#222'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x, GROUND_Y)
        ctx.lineTo(x, GROUND_Y - 46)
        ctx.stroke()
        ctx.fillStyle = theme.flag
        ctx.beginPath()
        ctx.moveTo(x, GROUND_Y - 46)
        ctx.lineTo(x + 16, GROUND_Y - 38)
        ctx.lineTo(x, GROUND_Y - 30)
        ctx.closePath()
        ctx.fill()
        ctx.globalAlpha = 1
      }

      if (flagOnscreen && sprites) {
        const flagSprite = sprites.flag[Math.floor(ts / 380) % 2]
        ctx.fillStyle = 'rgba(0,0,0,0.35)'
        ctx.fillRect(Math.round(flagSX) - PX * 2, GROUND_Y, PX * 4, PX)
        ctx.drawImage(flagSprite, Math.round(flagSX) - 1, GROUND_Y - flagSprite.height + PX)
      } else if (flagOnscreen) {
        drawFlag(flagSX)
        // Cup shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)'
        ctx.beginPath()
        ctx.ellipse(flagSX, GROUND_Y + 3, 5, 2, 0, 0, Math.PI * 2)
        ctx.fill()
      } 

      drawPickups(ctx, st, ts, cam, W)

      // Tee peg
      const teeSX = -cam
      if (teeSX > -10 && teeSX < W + 10) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(teeSX - 1, GROUND_Y - 5, 3, 5)
      }

      if (sprites) {
        drawGolfer(ctx, st, ts, cam)
      }

      drawTrail(ctx, st, ts, cam)

      // Ball ground shadow (flattens when ball is in air)
      if (ballVisible) {
        const shadowScale = Math.max(0.3, (ballY - (GROUND_Y - ARC_H)) / ARC_H)
        ctx.fillStyle = 'rgba(0,0,0,0.18)'
        ctx.beginPath()
        ctx.ellipse(st.ballVX - cam, GROUND_Y + 2, (BALL_R + 2) * shadowScale, 2 * shadowScale, 0, 0, Math.PI * 2)
        ctx.fill()

        // Ball
        const ballSheet = sprites && SHEETS.balls
        if (ballSheet) {
          const frame = ballSheet.frameAt(ballStyle, st.isAnim ? ts : 0)
          const c = ballSheet.slices.center || { x: 8, y: 4 }
          const s = BALL_SHEET_SCALE
          ballSheet.draw(ctx, frame, st.ballVX - cam - c.x * s, ballY + 3 - (c.y + 4) * s, s)
        } else if (sprites) {
          const b = sprites.ball
          ctx.drawImage(b, Math.round(st.ballVX - cam - b.width / 2), Math.round(ballY - b.height + 3))
        } else {
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(st.ballVX - cam, ballY, BALL_R, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = 'rgba(0,0,0,0.12)'
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }

      drawParticles(ctx, st, ts, cam)
      drawStamp(ctx, st, ts, cam, W)

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [targetDistance, approachDistance, theme, sprites, ballStyle])

  useEffect(() => {
    prevYardsRef.current = yardsThisRun
    const st = r.current
    st.ballVX = yardsThisRun * SCALE
    st.cameraX = 0
    st.isAnim = false
    st.animStart = null
    st.swingStart = null
    st.golferX = st.ballVX
    st.walkStart = null
    st.plan = null
    st.inCup = false
    st.particles = []
    st.trail = []
    st.stamp = null
  }, [holeKey ?? targetDistance])

  function startPlan(plan) {
    const st = r.current
    st.plan = plan
    st.isAnim = true
    st.animStart = null
    st.swingStart = null
    st.golferX = plan.fromX
    st.walkStart = null
    st.inCup = false
    st.trail = []
    prevYardsRef.current = yardsThisRun
  }

  // A new swing: plan its flight from where it started to where it came down,
  // then on to where it rests (the drop after a splash, or the cup).
  useEffect(() => {
    if (!shot || shot.key === lastShotKeyRef.current) return
    lastShotKeyRef.current = shot.key
    const fromX = shot.startAt * SCALE
    const landX = Math.min(shot.landAt, targetDistance + 20) * SCALE
    const restX = (shot.effect === 'holed' ? targetDistance : Math.min(yardsThisRun, targetDistance)) * SCALE
    const carry = Math.abs(landX - fromX)
    const gap = Math.abs(restX - landX)
    const arcScale = shot.tone === 'great' ? 1.15 : shot.tone === 'weak' ? 0.8 : 1
    let settleMs = 0
    let hopH = 0
    if (shot.effect === 'splash') settleMs = SPLASH_HIDE_MS + 300
    else if (shot.effect === 'holed') settleMs = gap > 0 ? ROLL_MS : 120
    else if (gap > 0) {
      settleMs = Math.min(600, HOP_MS + gap * 0.3)
      hopH = Math.min(shot.effect === 'skip' ? 24 : 30, gap * 0.15)
    }
    startPlan({
      key: shot.key,
      fromX,
      landX,
      restX,
      arcH: Math.max(30, Math.min(ARC_H * 1.1, carry * 0.32)) * arcScale,
      flightMs: Math.round(520 + Math.min(300, carry * 0.25)),
      settleMs,
      hopH,
      effect: shot.effect,
      tone: shot.tone,
      trail: shot.trail,
      look: HAZARD_LOOKS[shot.look] || null,
      stamp: { label: shot.label, sub: shot.sub, tone: shot.tone },
    })
  }, [shot?.key])

  // Fallback when the ball moves without a described shot.
  useEffect(() => {
    const prev = prevYardsRef.current
    if (yardsThisRun !== prev) {
      const to = Math.min(yardsThisRun, targetDistance) * SCALE
      startPlan({
        key: null,
        fromX: prev * SCALE,
        landX: to,
        restX: to,
        arcH: ARC_H,
        flightMs: ANIM_MS,
        settleMs: 0,
        hopH: 0,
        effect: 'dust',
        tone: 'plain',
        trail: false,
        look: null,
        stamp: null,
      })
    }
  }, [yardsThisRun, targetDistance])

  return (
    <canvas
      ref={canvasRef}
      className="hole-canvas"
    />
  )
}
