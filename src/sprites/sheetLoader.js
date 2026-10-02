// Loads sprite sheets exported from Aseprite (json-array format with tags and
// slices) and picks frames by tag and elapsed time.

export function loadSheet(imageUrl, data) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(createSheet(image, data))
    image.onerror = () => reject(new Error(`Could not load sprite sheet ${imageUrl}`))
    image.src = imageUrl
  })
}

function createSheet(image, data) {
  const frames = data.frames
  const tags = {}
  for (const tag of data.meta.frameTags || []) {
    const list = frames.slice(tag.from, tag.to + 1)
    tags[tag.name] = { frames: list, duration: list.reduce((sum, f) => sum + (f.duration || 100), 0) }
  }
  const slices = {}
  for (const slice of data.meta.slices || []) {
    const key = slice.keys[0]
    slices[slice.name] = {
      x: key.bounds.x + (key.pivot?.x || 0),
      y: key.bounds.y + (key.pivot?.y || 0),
    }
  }
  const first = frames[0]
  return {
    image,
    tags,
    slices,
    cell: first.sourceSize,
    tagDuration: name => tags[name]?.duration || 0,
    // Frame for `elapsed` ms into a tag; loops by default, else holds the last frame.
    frameAt(name, elapsed, loop = true) {
      const tag = tags[name]
      if (!tag) return first
      let t = Math.max(0, elapsed)
      if (loop) t %= tag.duration || 1
      for (const frame of tag.frames) {
        t -= frame.duration || 100
        if (t < 0) return frame
      }
      return tag.frames[tag.frames.length - 1]
    },
    draw(ctx, frame, x, y, scale) {
      const { x: sx, y: sy, w, h } = frame.frame
      const { x: ox, y: oy } = frame.spriteSourceSize
      ctx.drawImage(image, sx, sy, w, h, Math.round(x + ox * scale), Math.round(y + oy * scale), w * scale, h * scale)
    },
  }
}
