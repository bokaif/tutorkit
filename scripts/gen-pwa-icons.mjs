// Generates the PNG icon set the manifest references from a tiny SVG source.
// Run via: node scripts/gen-pwa-icons.mjs
import { writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import sharp from "sharp"

const OUT = "apps/web/public"
mkdirSync(OUT, { recursive: true })

// Brand color = HeroUI primary blue. Background ramps slightly so the icon
// reads as a glossy bubble next to other modern PWA icons.
const svg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="55%" stop-color="#2563EB"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
    <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.35"/>
      <stop offset="40%" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <rect width="512" height="220" rx="112" fill="url(#gloss)"/>
  <text x="256" y="318" text-anchor="middle"
        font-family="Inter, -apple-system, system-ui, sans-serif"
        font-weight="800" font-size="220" fill="#ffffff" letter-spacing="-6">T</text>
  <circle cx="380" cy="380" r="30" fill="#ffffff" fill-opacity="0.95"/>
</svg>`

const renders = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "icon-maskable-512.png", size: 512, padding: 64 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "favicon.png", size: 64 },
]

for (const r of renders) {
  const buffer = Buffer.from(svg(r.size))
  let pipeline = sharp(buffer).resize(r.size, r.size)
  if (r.padding) {
    pipeline = sharp(buffer).resize(r.size - r.padding * 2, r.size - r.padding * 2).extend({
      top: r.padding,
      bottom: r.padding,
      left: r.padding,
      right: r.padding,
      background: { r: 59, g: 130, b: 246, alpha: 1 },
    })
  }
  const out = join(OUT, r.name)
  await pipeline.png().toFile(out)
  console.log("wrote", out)
}
