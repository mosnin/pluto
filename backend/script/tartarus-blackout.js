#!/usr/bin/env node
// Tartarus "blackout" pass: rewrites the UI's own color literals so the dark
// theme is true black instead of charcoal/slate.
//
//   - dark neutrals and dark slate/navy tints  -> near-black neutral grays
//   - low-saturation grays of any lightness     -> neutral (tint removed)
//   - saturated accents (blue buttons, red errors, ...) are left alone
//
// Not idempotent: each run darkens dark colors again. After pulling upstream
// pinokiod changes, run it only on files the merge brought in:
//   node backend/script/tartarus-blackout.js <file> [<file> ...]
// With no arguments it rewrites every UI file (used once for the initial pass).

const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..', 'server')

const VENDOR = /(\.min\.(js|css)$)|^(filepond|dropzone|fuse|he|highlight|hotkeys|jsoneditor|mark|noty|popper|redoc|swagger|sweetalert2|timeago|tippy|tom-select|xterm)/

const listFiles = (dir, exts) => {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (['ace', 'css', 'webfonts', 'oldxterm', 'sound'].includes(entry.name)) continue
      out.push(...listFiles(full, exts))
    } else if (exts.includes(path.extname(entry.name)) && !VENDOR.test(entry.name)) {
      out.push(full)
    }
  }
  return out
}

const rgbToHsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  return [0, s, l]
}

// Returns a neutral [r, g, b] or null when the color should stay as-is.
const transform = (r, g, b) => {
  const [, s, l] = rgbToHsl(r, g, b)
  if (s < 0.02 && l > 0.36) return null // already neutral and not dark
  if (l <= 0.3 && (s <= 0.55 || l <= 0.12)) {
    // Dark surface/border: push toward black, keep relative ordering.
    const v = Math.round(Math.max(0, l - 0.05) * 0.6 * 255)
    return [v, v, v]
  }
  if (s <= 0.35) {
    // Gray with a tint (slate, zinc, ...): drop the tint, keep lightness.
    const v = Math.round(l * 255)
    return [v, v, v]
  }
  return null
}

const hex2 = (n) => n.toString(16).padStart(2, '0')

const recolor = (text) => {
  let changed = 0
  text = text.replace(/#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g, (match, h, offset, whole) => {
    // Skip URL fragments / ids like href="#abc" or "#fff-section"
    const prev = whole[offset - 1]
    if (prev && /[\w&/=]/.test(prev)) return match
    let r, g, b, a = ''
    if (h.length === 3) {
      r = parseInt(h[0] + h[0], 16); g = parseInt(h[1] + h[1], 16); b = parseInt(h[2] + h[2], 16)
    } else {
      r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16)
      if (h.length === 8) a = h.slice(6)
    }
    const next = transform(r, g, b)
    if (!next) return match
    const out = '#' + next.map(hex2).join('') + a
    if (out.toLowerCase() === match.toLowerCase() || (h.length === 3 && next[0] === r && next[1] === g && next[2] === b)) return match
    changed++
    return out
  })
  text = text.replace(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(,\s*[\d.]+%?\s*)?\)/g, (match, r, g, b, alpha) => {
    r = +r; g = +g; b = +b
    if (r > 255 || g > 255 || b > 255) return match
    const next = transform(r, g, b)
    if (!next || (next[0] === r && next[1] === g && next[2] === b)) return match
    changed++
    const fn = alpha ? 'rgba' : 'rgb'
    return `${fn}(${next.join(', ')}${alpha ? alpha.replace(/\s+$/, '') : ''})`
  })
  return { text, changed }
}

if (require.main === module) {
  const args = process.argv.slice(2)
  const files = args.length ? args.map((f) => path.resolve(f)) : [
    ...listFiles(path.join(root, 'public'), ['.css', '.js', '.html']),
    ...listFiles(path.join(root, 'views'), ['.ejs', '.html']),
  ]
  let total = 0
  let touched = 0
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8')
    const { text, changed } = recolor(src)
    if (changed && text !== src) {
      fs.writeFileSync(file, text)
      total += changed
      touched++
    }
  }
  console.log(`tartarus-blackout: rewrote ${total} colors in ${touched} files`)
}

module.exports = { recolor, transform }
