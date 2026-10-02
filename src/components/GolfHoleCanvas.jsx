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

const SCALE = 4
const H = 240
const GROUND_Y = 178
const BALL_R = 6
const ARC_H = 88
const ANIM_MS = 680
const CAM_LERP = 0.09
// Sprite mode leaves room left of the tee so the golfer is on screen.
const TEE_PAD = 96

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

export default function GolfHoleCanvas({
  yardsThisRun,
  targetDistance,
  approachDistance = 120,
  theme,
  themeId,
  useSprites = true,
}) {
  const canvasRef = useRef(null)
  const sprites = useMemo(
    () => (useSprites ? loadSprites(themeId, theme) : null),
    [useSprites, themeId, theme],
  )
  const rafRef = useRef(null)
  const prevYardsRef = useRef(0)

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
  })

  // Main render loop — runs once on mount, restarts if targetDistance changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = canvas.offsetWidth
    canvas.height = H

    // Golfer stands at the ball's last lie, swings, holds the finish while the
    // ball flies, then walks up to where it landed.
    function drawGolfer(ctx, st, ts, cam) {
      let pose
      const swingElapsed = st.swingStart == null ? null : ts - st.swingStart
      const holding = st.isAnim || (st.landedAt != null && ts - st.landedAt < 220)
      if (swingElapsed != null && (holding || swingElapsed < SWING_FINISH_MS)) {
        st.walkStart = null
        pose = swingPose(swingElapsed)
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
        pose = walkPose(ts)
      } else {
        st.swingStart = null
        pose = swingPose(null)
      }

      const frame = sprites.renderGolfer(pose)
      const x = Math.round(st.golferX - cam - (sprites.clubHead.x + 2) * PX)
      const y = GROUND_Y - GOLFER_H * PX + PX * 2
      if (x < -GOLFER_W * PX || x > canvas.width) return
      ctx.fillStyle = 'rgba(0,0,0,0.2)'
      ctx.beginPath()
      ctx.ellipse(x + 12 * PX, GROUND_Y + 3, 7 * PX, PX, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.drawImage(frame, x, y, GOLFER_W * PX, GOLFER_H * PX)
    }

    function draw(ts) {
      const ctx = canvas.getContext('2d')
      const W = canvas.width
      const vW = targetDistance * SCALE
      const st = r.current

      const pad = sprites ? TEE_PAD : 0

      // Advance arc animation. In sprite mode the ball waits for the club to
      // reach impact before it launches.
      let ballY = GROUND_Y
      if (st.isAnim) {
        if (!st.animStart) {
          if (sprites) {
            if (st.swingStart == null) st.swingStart = ts
            st.animStart = st.swingStart + SWING_IMPACT_MS
          } else {
            st.animStart = ts
          }
        }
        const rawT = Math.max(0, Math.min((ts - st.animStart) / ANIM_MS, 1))
        const t = easeOut(rawT)
        st.ballVX = st.animFrom + (st.animTo - st.animFrom) * t
        ballY = GROUND_Y - Math.sin(rawT * Math.PI) * ARC_H
        if (rawT >= 1) {
          st.isAnim = false
          st.ballVX = st.animTo
          st.animStart = null
          st.landedAt = ts
          ballY = GROUND_Y
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
        ctx.fillStyle = 'rgba(255, 255, 255, 0.68)'
        ctx.font = 'bold 11px system-ui'
        ctx.textAlign = 'center'
        const labelX = Math.max(44, Math.min(W - 44, approachStartX + 64))
        ctx.fillText('APPROACH', labelX, GROUND_Y - 12)
      }

      // Yardage tick marks
      ctx.textAlign = 'center'
      ctx.font = 'bold 11px system-ui'
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

      // Tee peg
      const teeSX = -cam
      if (teeSX > -10 && teeSX < W + 10) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(teeSX - 1, GROUND_Y - 5, 3, 5)
      }

      if (sprites) {
        drawGolfer(ctx, st, ts, cam)
      }

      // Ball ground shadow (flattens when ball is in air)
      const shadowScale = Math.max(0.3, (ballY - (GROUND_Y - ARC_H)) / ARC_H)
      ctx.fillStyle = 'rgba(0,0,0,0.18)'
      ctx.beginPath()
      ctx.ellipse(st.ballVX - cam, GROUND_Y + 2, (BALL_R + 2) * shadowScale, 2 * shadowScale, 0, 0, Math.PI * 2)
      ctx.fill()

      // Ball
      if (sprites) {
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

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [targetDistance, approachDistance, theme, sprites])

  useEffect(() => {
    prevYardsRef.current = yardsThisRun
    r.current.ballVX = yardsThisRun * SCALE
    r.current.cameraX = 0
    r.current.isAnim = false
    r.current.animStart = null
    r.current.swingStart = null
    r.current.golferX = r.current.ballVX
    r.current.walkStart = null
  }, [targetDistance])

  // Trigger arc animation on each swing
  useEffect(() => {
    const prev = prevYardsRef.current
    if (yardsThisRun !== prev) {
      r.current.animFrom = prev * SCALE
      r.current.animTo = Math.min(yardsThisRun, targetDistance) * SCALE
      r.current.isAnim = true
      r.current.animStart = null
      r.current.swingStart = null
      r.current.golferX = r.current.animFrom
      r.current.walkStart = null
      prevYardsRef.current = yardsThisRun
    }
  }, [yardsThisRun, targetDistance])

  return (
    <canvas
      ref={canvasRef}
      className="hole-canvas"
    />
  )
}
