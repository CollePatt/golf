import { loadSheet } from './sheetLoader.js'
import golferPng from '../assets/sprites/golfer.png'
import golferData from '../assets/sprites/golfer.json'
import astronautPng from '../assets/sprites/astronaut.png'
import astronautData from '../assets/sprites/astronaut.json'
import ballsPng from '../assets/sprites/balls.png'
import ballsData from '../assets/sprites/balls.json'
import pickupsPng from '../assets/sprites/pickups.png'
import pickupsData from '../assets/sprites/pickups.json'

// Sheets exported from art/sprites/*.aseprite. They load in the background;
// until one arrives (or if it fails) the renderer uses the code-drawn sprites.
const SOURCES = {
  meadow: [golferPng, golferData],
  space: [astronautPng, astronautData],
  balls: [ballsPng, ballsData],
  pickups: [pickupsPng, pickupsData],
}

export const SHEETS = {}
let requested = false

export function requestSheets() {
  if (requested || typeof Image === 'undefined') return
  requested = true
  for (const [name, [url, data]] of Object.entries(SOURCES)) {
    loadSheet(url, data)
      .then(sheet => { SHEETS[name] = sheet })
      .catch(err => console.warn(err.message))
  }
}
