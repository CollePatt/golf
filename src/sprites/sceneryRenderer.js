import { hash01, shade } from './pixelSprite.js'
import { PX } from './courseSprites.js'

// Draws repeating sprites for one parallax layer. Placement is hashed from the
// segment index, so the same world spot always gets the same scenery.
function scatter(ctx, W, cam, { factor, segment, chance, seed, draw }) {
  const offset = cam * factor
  const first = Math.floor(offset / segment) - 1
  const last = Math.ceil((offset + W) / segment) + 1
  for (let i = first; i <= last; i++) {
    if (hash01(i, seed) > chance) continue
    const jitter = hash01(i, seed + 1)
    draw(Math.round(i * segment + jitter * segment * 0.6 - offset), i)
  }
}

function snap(v) {
  return Math.round(v / PX) * PX
}

function drawHills(ctx, W, cam, groundY, color, factor, height, seed, jagged) {
  ctx.fillStyle = color
  const step = PX * 2
  for (let x = 0; x < W + step; x += step) {
    const wx = (x + cam * factor) * 0.01
    let n = Math.sin(wx * 0.45 + seed) + 0.5 * Math.sin(wx * 1.3 + seed * 2.1)
    if (jagged) n = Math.abs(Math.sin(wx * 0.8 + seed)) * 1.4 - 0.3 + 0.35 * Math.sin(wx * 3.1 + seed)
    const h = snap(height * (0.65 + 0.35 * n))
    ctx.fillRect(x, groundY - h, step, h)
  }
}

export function drawSpriteScenery(ctx, { W, cam, ts, groundY, sprites }) {
  const { recipe } = sprites

  if (recipe.stars) {
    scatter(ctx, W, cam, {
      factor: 0.03, segment: 40, chance: 0.85, seed: 11,
      draw: (x, i) => {
        const y = snap(8 + hash01(i, 12) * (groundY - 70))
        const twinkle = Math.sin(ts / 420 + i * 1.7) > 0.6
        const big = hash01(i, 13) > 0.85
        ctx.fillStyle = twinkle ? '#ffffff' : hash01(i, 14) > 0.5 ? '#cbd5f5' : '#8f9bc4'
        ctx.fillRect(x, y, big ? PX : PX - 1, big ? PX : PX - 1)
      },
    })
  }

  if (sprites.skyBody) {
    const body = sprites.skyBody
    const x = snap(W * recipe.sky.x - cam * 0.02)
    ctx.drawImage(body, x - body.width / 2, recipe.sky.y - body.height / 2)
  }

  if (sprites.cloud) {
    const drift = ts * 0.006
    scatter(ctx, W, cam - drift / 0.1, {
      factor: 0.1, segment: 220, chance: 0.55, seed: 21,
      draw: (x, i) => {
        const y = snap(14 + hash01(i, 22) * 70)
        ctx.globalAlpha = 0.9
        ctx.drawImage(sprites.cloud, x, y)
        ctx.globalAlpha = 1
      },
    })
  }

  const moon = !recipe.tree
  drawHills(ctx, W, cam, groundY, recipe.hills[0], 0.15, moon ? 74 : 64, 1.3, moon)
  if (sprites.treeFar) {
    scatter(ctx, W, cam, {
      factor: 0.3, segment: 30, chance: 0.42, seed: 31,
      draw: x => ctx.drawImage(sprites.treeFar, x, groundY - 24 - sprites.treeFar.height + 2),
    })
  }
  drawHills(ctx, W, cam, groundY, recipe.hills[1], 0.35, moon ? 40 : 30, 4.2, moon)

  if (sprites.prop) {
    scatter(ctx, W, cam, {
      factor: 0.6, segment: 700, chance: 0.6, seed: 41,
      draw: x => ctx.drawImage(sprites.prop, x, groundY - sprites.prop.height + PX),
    })
  }
  if (sprites.tree) {
    scatter(ctx, W, cam, {
      factor: 0.7, segment: 150, chance: 0.5, seed: 51,
      draw: x => ctx.drawImage(sprites.tree, x, groundY - sprites.tree.height + PX),
    })
  }
  if (sprites.decor) {
    scatter(ctx, W, cam, {
      factor: 0.85, segment: 110, chance: 0.45, seed: 61,
      draw: x => ctx.drawImage(sprites.decor, x, groundY - sprites.decor.height + PX),
    })
  }
}

function fillTiled(ctx, tile, cam, x, y, w, h) {
  const pattern = ctx.createPattern(tile, 'repeat')
  ctx.save()
  const shift = -(Math.round(cam) % tile.width)
  ctx.translate(shift, y)
  ctx.fillStyle = pattern
  ctx.fillRect(x - shift, 0, w, h)
  ctx.restore()
}

export function drawSpriteGround(ctx, { W, H, cam, groundY, sprites, theme }) {
  fillTiled(ctx, sprites.groundTile, cam, 0, groundY, W, H - groundY)
  fillTiled(ctx, sprites.fairwayTile, cam, 0, groundY - 2 * PX, W, sprites.fairwayTile.height)
  ctx.fillStyle = shade(theme.ground, -0.3)
  ctx.fillRect(0, groundY - 2 * PX + sprites.fairwayTile.height, W, PX)

  if (sprites.crater) {
    scatter(ctx, W, cam, {
      factor: 1, segment: 160, chance: 0.5, seed: 71,
      draw: (x, i) => ctx.drawImage(sprites.crater, x, snap(groundY + 22 + hash01(i, 72) * (H - groundY - 40))),
    })
  }
}
