#!/usr/bin/env node
// Re-exports every art/sprites/*.aseprite file into the PNG + JSON pair the
// game loads, using the Aseprite CLI. Set ASEPRITE to the binary path if
// `aseprite` isn't on your PATH (on macOS usually
// /Applications/Aseprite.app/Contents/MacOS/aseprite).

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const artDir = path.join(root, 'art/sprites')
const outDir = path.join(root, 'src/assets/sprites')
const aseprite = process.env.ASEPRITE || 'aseprite'

const files = fs.readdirSync(artDir).filter(f => f.endsWith('.aseprite'))
for (const file of files) {
  const name = path.basename(file, '.aseprite')
  const result = spawnSync(aseprite, [
    '-b', path.join(artDir, file),
    '--sheet', path.join(outDir, `${name}.png`),
    '--data', path.join(outDir, `${name}.json`),
    '--format', 'json-array',
    '--sheet-type', 'rows',
    '--sheet-columns', name === 'golfer' || name === 'astronaut' ? '8' : '4',
    '--list-tags',
    '--list-slices',
  ], { stdio: 'inherit' })
  if (result.error) {
    console.error(`Could not run "${aseprite}". Install Aseprite or set ASEPRITE to its path.`)
    process.exit(1)
  }
  if (result.status !== 0) process.exit(result.status)
  console.log(`exported ${name}`)
}
