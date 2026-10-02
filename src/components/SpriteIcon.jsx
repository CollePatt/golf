import ballsPng from '../assets/sprites/balls.png'
import ballsData from '../assets/sprites/balls.json'
import pickupsPng from '../assets/sprites/pickups.png'
import pickupsData from '../assets/sprites/pickups.json'

const SHEETS = {
  balls: { url: ballsPng, data: ballsData },
  pickups: { url: pickupsPng, data: pickupsData },
}

// First frame of a sheet tag, drawn as a pixelated CSS background.
export default function SpriteIcon({ sheet, tag, scale = 3, className = '', title }) {
  const source = SHEETS[sheet]
  const meta = source?.data.meta.frameTags.find(entry => entry.name === tag)
  if (!meta) return null
  const { frame } = source.data.frames[meta.from]
  const { w, h } = source.data.meta.size
  return (
    <span
      className={`sprite-icon ${className}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{
        width: frame.w * scale,
        height: frame.h * scale,
        backgroundImage: `url(${source.url})`,
        backgroundSize: `${w * scale}px ${h * scale}px`,
        backgroundPosition: `-${frame.x * scale}px -${frame.y * scale}px`,
      }}
    />
  )
}
