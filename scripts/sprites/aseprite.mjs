import zlib from 'node:zlib'

// Writes RGBA .aseprite files (one layer, tags, slices, palette) following
// https://github.com/aseprite/aseprite/blob/main/docs/ase-file-specs.md

class Writer {
  constructor() { this.parts = [] }
  byte(v) { this.parts.push(Buffer.from([v & 255])) }
  word(v) { const b = Buffer.alloc(2); b.writeUInt16LE(v); this.parts.push(b) }
  short(v) { const b = Buffer.alloc(2); b.writeInt16LE(v); this.parts.push(b) }
  dword(v) { const b = Buffer.alloc(4); b.writeUInt32LE(v); this.parts.push(b) }
  long(v) { const b = Buffer.alloc(4); b.writeInt32LE(v); this.parts.push(b) }
  zeros(n) { this.parts.push(Buffer.alloc(n)) }
  string(s) { const b = Buffer.from(s, 'utf8'); this.word(b.length); this.parts.push(b) }
  bytes(buf) { this.parts.push(Buffer.from(buf)) }
  buffer() { return Buffer.concat(this.parts) }
}

function chunk(type, build) {
  const body = new Writer()
  build(body)
  const data = body.buffer()
  const w = new Writer()
  w.dword(data.length + 6)
  w.word(type)
  w.bytes(data)
  return w.buffer()
}

function bounds(canvas) {
  let x0 = canvas.width, y0 = canvas.height, x1 = -1, y1 = -1
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if (canvas.data[(y * canvas.width + x) * 4 + 3] === 0) continue
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y)
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }
}

function collectPalette(frames) {
  const seen = new Map()
  for (const { canvas } of frames) {
    for (let i = 0; i < canvas.data.length; i += 4) {
      if (canvas.data[i + 3] === 0) continue
      const k = `${canvas.data[i]},${canvas.data[i + 1]},${canvas.data[i + 2]},${canvas.data[i + 3]}`
      if (!seen.has(k)) seen.set(k, [canvas.data[i], canvas.data[i + 1], canvas.data[i + 2], canvas.data[i + 3]])
    }
  }
  return [[0, 0, 0, 0], ...seen.values()].slice(0, 256)
}

export function encodeAseprite({ width, height, frames, tags = [], slices = [], layerName = 'Layer 1' }) {
  const palette = collectPalette(frames)
  const frameBuffers = frames.map(({ canvas, duration }, index) => {
    const chunks = []
    if (index === 0) {
      chunks.push(chunk(0x2019, w => {
        w.dword(palette.length); w.dword(0); w.dword(palette.length - 1); w.zeros(8)
        palette.forEach(([r, g, b, a]) => { w.word(0); w.byte(r); w.byte(g); w.byte(b); w.byte(a) })
      }))
      chunks.push(chunk(0x2004, w => {
        w.word(3); w.word(0); w.word(0); w.word(0); w.word(0); w.word(0); w.byte(255); w.zeros(3)
        w.string(layerName)
      }))
    }
    const box = bounds(canvas)
    if (box) {
      chunks.push(chunk(0x2005, w => {
        w.word(0); w.short(box.x); w.short(box.y); w.byte(255); w.word(2); w.short(0); w.zeros(5)
        w.word(box.w); w.word(box.h)
        const raw = Buffer.alloc(box.w * box.h * 4)
        for (let y = 0; y < box.h; y++) {
          const start = ((box.y + y) * canvas.width + box.x) * 4
          Buffer.from(canvas.data.buffer, canvas.data.byteOffset + start, box.w * 4).copy(raw, y * box.w * 4)
        }
        w.bytes(zlib.deflateSync(raw))
      }))
    }
    if (index === 0 && tags.length) {
      chunks.push(chunk(0x2018, w => {
        w.word(tags.length); w.zeros(8)
        tags.forEach(tag => {
          w.word(tag.from); w.word(tag.to); w.byte(0); w.word(0); w.zeros(6)
          w.bytes(tag.color || [0, 0, 0]); w.byte(0)
          w.string(tag.name)
        })
      }))
    }
    if (index === 0) {
      slices.forEach(slice => {
        chunks.push(chunk(0x2022, w => {
          w.dword(1); w.dword(slice.pivot ? 2 : 0); w.dword(0); w.string(slice.name)
          w.dword(0); w.long(slice.x); w.long(slice.y); w.dword(slice.w); w.dword(slice.h)
          if (slice.pivot) { w.long(slice.pivot.x); w.long(slice.pivot.y) }
        }))
      })
    }
    const body = Buffer.concat(chunks)
    const header = new Writer()
    header.dword(body.length + 16)
    header.word(0xf1fa)
    header.word(Math.min(chunks.length, 0xffff))
    header.word(duration)
    header.zeros(2)
    header.dword(chunks.length)
    return Buffer.concat([header.buffer(), body])
  })

  const frameData = Buffer.concat(frameBuffers)
  const h = new Writer()
  h.dword(128 + frameData.length)
  h.word(0xa5e0)
  h.word(frames.length)
  h.word(width)
  h.word(height)
  h.word(32)
  h.dword(1)
  h.word(100)
  h.dword(0)
  h.dword(0)
  h.byte(0)
  h.zeros(3)
  h.word(palette.length === 256 ? 0 : palette.length)
  h.byte(1)
  h.byte(1)
  h.short(0)
  h.short(0)
  h.word(width)
  h.word(height)
  h.zeros(84)
  return Buffer.concat([h.buffer(), frameData])
}
