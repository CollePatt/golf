// Tiny pixel-art pipeline: sprites are authored as rows of palette characters
// and rasterized once into offscreen canvases. '.' (or any unmapped character)
// is transparent.

// Canvas creation is swappable so the sheet generator script can run the same
// sprite code in Node against a plain RGBA buffer.
let canvasFactory = () => document.createElement('canvas')

export function setCanvasFactory(factory) {
  canvasFactory = factory
}

export function spritesSupported() {
  if (typeof document === 'undefined') return false
  try {
    const probe = document.createElement('canvas')
    return Boolean(probe.getContext && probe.getContext('2d'))
  } catch {
    return false
  }
}

export function spriteSize(rows) {
  return {
    w: Math.max(...rows.map(row => row.length)),
    h: rows.length,
  }
}

export function paintRows(ctx, rows, palette, ox = 0, oy = 0, scale = 1) {
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const color = palette[row[x]]
      if (!color) continue
      ctx.fillStyle = color
      ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale)
    }
  })
}

export function buildSprite(rows, palette, scale = 1) {
  const { w, h } = spriteSize(rows)
  const canvas = canvasFactory()
  canvas.width = w * scale
  canvas.height = h * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d context unavailable')
  paintRows(ctx, rows, palette, 0, 0, scale)
  return canvas
}

export function makeCanvas(w, h) {
  const canvas = canvasFactory()
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d context unavailable')
  return { canvas, ctx }
}

// Pixel-perfect line on a 1x canvas (Bresenham), used for arms and club shafts.
export function pixelLine(ctx, x0, y0, x1, y1, color) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1)
  const dx = Math.abs(x1 - x0)
  const dy = -Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx + dy
  ctx.fillStyle = color
  for (;;) {
    ctx.fillRect(x0, y0, 1, 1)
    if (x0 === x1 && y0 === y1) break
    const e2 = 2 * err
    if (e2 >= dy) { err += dy; x0 += sx }
    if (e2 <= dx) { err += dx; y0 += sy }
  }
}

// Deterministic hash in [0, 1) so scenery placement is stable as the camera moves.
export function hash01(a, b = 0) {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

export function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16)
  const mix = c => Math.max(0, Math.min(255, Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)))
  const r = mix((n >> 16) & 255)
  const g = mix((n >> 8) & 255)
  const b = mix(n & 255)
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}
