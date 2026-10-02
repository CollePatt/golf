// Minimal stand-in for an HTML canvas so the game's sprite code can run in
// Node. Supports exactly what src/sprites uses: fillRect, clearRect and
// drawImage(source, x, y) with straight alpha.

function parseColor(style) {
  if (style.startsWith('#')) {
    const n = parseInt(style.slice(1, 7), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255]
  }
  const m = style.match(/rgba?\(([^)]+)\)/)
  if (!m) throw new Error(`Unsupported color ${style}`)
  const [r, g, b, a = 1] = m[1].split(',').map(Number)
  return [r, g, b, Math.round(a * 255)]
}

export class RgbaCanvas {
  constructor(width = 0, height = 0) {
    this._w = width
    this._h = height
    this.data = new Uint8Array(width * height * 4)
  }

  get width() { return this._w }
  set width(w) { this._w = w; this.data = new Uint8Array(this._w * this._h * 4) }
  get height() { return this._h }
  set height(h) { this._h = h; this.data = new Uint8Array(this._w * this._h * 4) }

  getContext() {
    const canvas = this
    return {
      fillStyle: '#000000',
      fillRect(x, y, w, h) {
        const color = parseColor(this.fillStyle)
        for (let yy = Math.max(0, y); yy < Math.min(canvas.height, y + h); yy++) {
          for (let xx = Math.max(0, x); xx < Math.min(canvas.width, x + w); xx++) {
            canvas.data.set(color, (yy * canvas.width + xx) * 4)
          }
        }
      },
      clearRect(x, y, w, h) {
        for (let yy = Math.max(0, y); yy < Math.min(canvas.height, y + h); yy++) {
          for (let xx = Math.max(0, x); xx < Math.min(canvas.width, x + w); xx++) {
            canvas.data.fill(0, (yy * canvas.width + xx) * 4, (yy * canvas.width + xx) * 4 + 4)
          }
        }
      },
      drawImage(src, dx, dy) {
        canvas.blit(src, 0, 0, src.width, src.height, dx, dy)
      },
    }
  }

  blit(src, sx, sy, w, h, dx, dy) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const tx = dx + x
        const ty = dy + y
        if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) continue
        const si = ((sy + y) * src.width + sx + x) * 4
        if (src.data[si + 3] === 0) continue
        this.data.set(src.data.subarray(si, si + 4), (ty * this.width + tx) * 4)
      }
    }
  }
}
