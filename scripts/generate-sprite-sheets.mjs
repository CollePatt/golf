#!/usr/bin/env node
// Seeds the editable sprite sheets from the code-drawn sprites in src/sprites.
//
//   npm run sprites:generate            writes any sheets that don't exist yet
//   npm run sprites:generate -- --force overwrites everything (loses Aseprite edits!)
//
// For each sheet it writes art/sprites/<name>.aseprite (the file you edit) and
// src/assets/sprites/<name>.png + .json (what the game loads, in Aseprite's
// json-array export format). After editing in Aseprite, re-export with
// `npm run sprites:export`.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { RgbaCanvas } from './sprites/rgbaCanvas.mjs'
import { encodePng } from './sprites/png.mjs'
import { encodeAseprite } from './sprites/aseprite.mjs'
import { setCanvasFactory, makeCanvas } from '../src/sprites/pixelSprite.js'
import { createGolferRenderer, addressClubHead, swingPose, walkPose, GOLFER_W, GOLFER_H } from '../src/sprites/golferSprites.js'
import { BALL_DESIGNS, BALL_CELL, BALL_CENTER, PICKUPS, PICKUP_CELL } from '../src/sprites/itemSprites.js'

setCanvasFactory(() => new RgbaCanvas())

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const artDir = path.join(root, 'art/sprites')
const outDir = path.join(root, 'src/assets/sprites')
const force = process.argv.includes('--force')

function snapshot(canvas) {
  const copy = new RgbaCanvas(canvas.width, canvas.height)
  copy.data.set(canvas.data)
  return copy
}

function golferSheet(variant, name) {
  const render = createGolferRenderer(variant)
  const frames = []
  const tags = []
  const addTag = (tag, poses) => {
    const from = frames.length
    poses.forEach(([pose, duration]) => frames.push({ canvas: snapshot(render(pose)), duration }))
    tags.push({ name: tag, from, to: frames.length - 1 })
  }
  // Swing samples; the swing tag's total duration is the moment of impact.
  const swingTimes = [40, 100, 150, 190, 220, 265, 295, 310]
  const followTimes = [310, 345, 385, 430, 480, 680]
  const sample = times => times.slice(0, -1).map((t, i) => [swingPose(t), times[i + 1] - t])

  addTag('idle', [[swingPose(null), 400]])
  addTag('swing', sample(swingTimes))
  addTag('follow', sample(followTimes))
  addTag('walk', [[walkPose(0), 110], [walkPose(110), 110]])

  const head = addressClubHead()
  return {
    name,
    cell: { w: GOLFER_W, h: GOLFER_H },
    columns: 8,
    frames,
    tags,
    // Where the ball sits relative to the golfer, and where the ground is.
    slices: [{ name: 'ball', x: head.x + 2, y: GOLFER_H - 2, w: 1, h: 1, pivot: { x: 0, y: 0 } }],
  }
}

function itemSheet(name, cell, designs, slices = []) {
  const frames = []
  const tags = []
  designs.forEach(design => {
    const from = frames.length
    for (let f = 0; f < design.frames; f++) {
      const { canvas, ctx } = makeCanvas(cell.w, cell.h)
      design.draw(ctx, f)
      frames.push({ canvas, duration: design.duration })
    }
    tags.push({ name: design.name, from, to: frames.length - 1 })
  })
  return { name, cell, columns: 4, frames, tags, slices }
}

function sheetJson(sheet, size) {
  const { name, cell, columns, frames, tags, slices } = sheet
  return {
    frames: frames.map((frame, i) => ({
      filename: `${name} ${i}.aseprite`,
      frame: { x: (i % columns) * cell.w, y: Math.floor(i / columns) * cell.h, w: cell.w, h: cell.h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: cell.w, h: cell.h },
      sourceSize: { w: cell.w, h: cell.h },
      duration: frame.duration,
    })),
    meta: {
      app: 'https://www.aseprite.org/',
      version: '1.3',
      image: `${name}.png`,
      format: 'RGBA8888',
      size,
      scale: '1',
      frameTags: tags.map(tag => ({ name: tag.name, from: tag.from, to: tag.to, direction: 'forward', color: '#000000ff' })),
      layers: [{ name: 'Layer 1', opacity: 255, blendMode: 'normal' }],
      slices: slices.map(s => ({
        name: s.name,
        color: '#0000ffff',
        keys: [{ frame: 0, bounds: { x: s.x, y: s.y, w: s.w, h: s.h }, ...(s.pivot ? { pivot: s.pivot } : {}) }],
      })),
    },
  }
}

function writeSheet(sheet) {
  const asePath = path.join(artDir, `${sheet.name}.aseprite`)
  if (fs.existsSync(asePath) && !force) {
    console.log(`skip  ${sheet.name} (exists; pass --force to overwrite)`)
    return
  }
  const { cell, columns, frames } = sheet
  const rows = Math.ceil(frames.length / columns)
  const png = new RgbaCanvas(cell.w * Math.min(columns, frames.length), cell.h * rows)
  frames.forEach((frame, i) => png.blit(frame.canvas, 0, 0, cell.w, cell.h, (i % columns) * cell.w, Math.floor(i / columns) * cell.h))

  fs.mkdirSync(artDir, { recursive: true })
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(asePath, encodeAseprite({ width: cell.w, height: cell.h, frames, tags: sheet.tags, slices: sheet.slices }))
  fs.writeFileSync(path.join(outDir, `${sheet.name}.png`), encodePng(png))
  fs.writeFileSync(path.join(outDir, `${sheet.name}.json`), JSON.stringify(sheetJson(sheet, { w: png.width, h: png.height }), null, 1) + '\n')
  console.log(`wrote ${sheet.name} (${frames.length} frames, ${sheet.tags.map(t => t.name).join(', ')})`)
}

;[
  golferSheet('meadow', 'golfer'),
  golferSheet('space', 'astronaut'),
  itemSheet('balls', BALL_CELL, BALL_DESIGNS, [{ name: 'center', x: BALL_CENTER.x, y: BALL_CENTER.y, w: 1, h: 1, pivot: { x: 0, y: 0 } }]),
  itemSheet('pickups', PICKUP_CELL, PICKUPS),
].forEach(writeSheet)
