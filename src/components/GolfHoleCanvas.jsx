import { useRef, useEffect } from 'react'

const SCALE = 4
const H = 240
const GROUND_Y = 178
const BALL_R = 6
const ARC_H = 88
const ANIM_MS = 680
const CAM_LERP = 0.09

function easeOut(t) {
  return 1 - (1 - t) * (1 - t)
}

export default function GolfHoleCanvas({ yardsThisRun, targetDistance }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const prevYardsRef = useRef(0)

  const r = useRef({
    ballVX: 0,
    cameraX: 0,
    isAnim: false,
    animFrom: 0,
    animTo: 0,
    animStart: null,
  })

  // Main render loop — runs once on mount, restarts if targetDistance changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = canvas.offsetWidth
    canvas.height = H

    function draw(ts) {
      const ctx = canvas.getContext('2d')
      const W = canvas.width
      const vW = targetDistance * SCALE
      const st = r.current

      // Advance arc animation
      let ballY = GROUND_Y
      if (st.isAnim) {
        if (!st.animStart) st.animStart = ts
        const rawT = Math.min((ts - st.animStart) / ANIM_MS, 1)
        const t = easeOut(rawT)
        st.ballVX = st.animFrom + (st.animTo - st.animFrom) * t
        ballY = GROUND_Y - Math.sin(rawT * Math.PI) * ARC_H
        if (rawT >= 1) {
          st.isAnim = false
          st.ballVX = st.animTo
          st.animStart = null
          ballY = GROUND_Y
        }
      }

      // Smooth camera follow
      const targetCamX = Math.max(0, Math.min(vW - W, st.ballVX - W / 2))
      st.cameraX += (targetCamX - st.cameraX) * CAM_LERP
      const cam = st.cameraX

      // Clear
      ctx.clearRect(0, 0, W, H)

      // Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y)
      skyGrad.addColorStop(0, '#5b9fd4')
      skyGrad.addColorStop(1, '#b8d9ef')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, W, GROUND_Y)

      // Ground body
      ctx.fillStyle = '#3a6b32'
      ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y)

      // Fairway top stripe
      ctx.fillStyle = '#4e8a43'
      ctx.fillRect(0, GROUND_Y, W, 10)

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
        ctx.fillStyle = '#e53935'
        ctx.beginPath()
        ctx.moveTo(x, GROUND_Y - 46)
        ctx.lineTo(x + 16, GROUND_Y - 38)
        ctx.lineTo(x, GROUND_Y - 30)
        ctx.closePath()
        ctx.fill()
        ctx.globalAlpha = 1
      }

      if (flagOnscreen) {
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

      // Ball ground shadow (flattens when ball is in air)
      const shadowScale = Math.max(0.3, (ballY - (GROUND_Y - ARC_H)) / ARC_H)
      ctx.fillStyle = 'rgba(0,0,0,0.18)'
      ctx.beginPath()
      ctx.ellipse(st.ballVX - cam, GROUND_Y + 2, (BALL_R + 2) * shadowScale, 2 * shadowScale, 0, 0, Math.PI * 2)
      ctx.fill()

      // Ball
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(st.ballVX - cam, ballY, BALL_R, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'
      ctx.lineWidth = 1
      ctx.stroke()

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [targetDistance])

  // Trigger arc animation on each swing
  useEffect(() => {
    const prev = prevYardsRef.current
    if (yardsThisRun !== prev) {
      r.current.animFrom = prev * SCALE
      r.current.animTo = Math.min(yardsThisRun, targetDistance) * SCALE
      r.current.isAnim = true
      r.current.animStart = null
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
