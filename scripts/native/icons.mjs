/**
 * Source images for the native app icon and splash (NATIVE.md): the same mark
 * as public/favicon.png, a football on a tilted yellow tile over the pitch.
 * Writes native/assets/*.png; then `npm run native:icons` turns them into
 * every iOS and Android size.
 */
import { mkdirSync } from 'node:fs'
import sharp from 'sharp'

const PITCH = '#0E4A2C'
const SHADOW = '#093820'
const YELLOW = '#FFD62E'
const BALL = '#FFFDF6'
const INK = '#0A2417'

/** A regular pentagon centred on (cx, cy), point up, rotated by `rot` degrees. */
const pentagon = (cx, cy, r, rot = 0) =>
  Array.from({ length: 5 }, (_, i) => {
    const a = ((rot - 90 + i * 72) * Math.PI) / 180
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
  }).join(' ')

/** The mark in a 1024 box: tile + ball. `scale` shrinks it around the centre. */
const mark = (scale = 1) => {
  const c = 512
  const ball = 205
  const patches = Array.from({ length: 5 }, (_, i) => {
    const a = ((-90 + 36 + i * 72) * Math.PI) / 180
    return `<polygon points="${pentagon(
      c + ball * 1.04 * Math.cos(a),
      c + ball * 1.04 * Math.sin(a),
      66,
      36 + i * 72,
    )}" fill="${INK}"/>`
  }).join('')
  return (
    `<g transform="translate(${c} ${c}) scale(${scale}) translate(${-c} ${-c})">` +
    `<g transform="rotate(-6 ${c} ${c})">` +
    `<rect x="222" y="252" width="580" height="580" rx="150" fill="${SHADOW}" opacity="0.55"/>` +
    `<rect x="222" y="222" width="580" height="580" rx="150" fill="${YELLOW}"/></g>` +
    `<clipPath id="ball"><circle cx="${c}" cy="${c}" r="${ball}"/></clipPath>` +
    `<circle cx="${c}" cy="${c}" r="${ball}" fill="${BALL}"/>` +
    `<g clip-path="url(#ball)"><polygon points="${pentagon(
      c,
      c,
      74,
    )}" fill="${INK}"/>${patches}</g>` +
    `<circle cx="${c}" cy="${c}" r="${ball}" fill="none" stroke="${INK}" stroke-width="14"/></g>`
  )
}

const svg = (size, { bg = true, scale = 1 } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">` +
  (bg ? `<rect width="1024" height="1024" fill="${PITCH}"/>` : '') +
  mark(scale) +
  '</svg>'

const out = (data, file) => sharp(Buffer.from(data)).png().toFile(`native/assets/${file}`)

mkdirSync('native/assets', { recursive: true })
await Promise.all([
  out(svg(1024), 'icon-only.png'),
  // Android adaptive icons crop to a circle: keep the mark inside the safe zone.
  out(svg(1024, { bg: false, scale: 0.72 }), 'icon-foreground.png'),
  out(svg(1024, { scale: 0 }), 'icon-background.png'),
  out(svg(2732, { scale: 0.22 }), 'splash.png'),
  out(svg(2732, { scale: 0.22 }), 'splash-dark.png'),
])
console.log('native/assets written')
