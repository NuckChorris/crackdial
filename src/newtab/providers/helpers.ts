import type {SiteContext} from '#/newtab/providers/types'

/** Resolve a possibly-relative href against a base URL, or null if invalid. */
export function resolveUrl(href: string, base: URL | string): string | null {
  try {
    return new URL(href, base).href
  } catch {
    return null
  }
}

/**
 * Normalize any CSS color (named, hex, rgb, hsl, …) to #rrggbb using the
 * browser's own parser. Returns null for invalid or fully transparent values.
 */
export function normalizeColor(input: string | null | undefined): string | null {
  const value = (input || '').trim()
  if (!value) return null

  const probe = document.createElement('span')
  probe.style.color = value
  // The browser leaves style.color empty for values it can't parse.
  if (!probe.style.color) return null

  probe.style.display = 'none'
  document.body.appendChild(probe)
  const computed = getComputedStyle(probe).color
  probe.remove()

  const m = computed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/i)
  if (!m) return null
  if (m[4] !== undefined && Number(m[4]) === 0) return null // transparent

  const hex = m
    .slice(1, 4)
    .map((n) => Number(n).toString(16).padStart(2, '0'))
    .join('')
  return `#${hex}`
}

/** Remove scripts and inline event handlers before we inline external SVG. */
export function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .trim()
}

/** Pull sanitized <svg>…</svg> markup out of arbitrary text, or null. */
export function extractInlineSvg(text: string): string | null {
  const start = text.indexOf('<svg')
  const end = text.lastIndexOf('</svg>')
  if (start < 0 || end < 0) return null
  return sanitizeSvg(text.slice(start, end + '</svg>'.length))
}

/** Fetch an SVG file and return sanitized <svg>…</svg> markup, or null. */
export async function fetchSvg(
  fetchText: SiteContext['fetchText'],
  url: string
): Promise<string | null> {
  const text = await fetchText(url)
  return text ? extractInlineSvg(text) : null
}

const NON_COLORS = /^(none|transparent|currentcolor|inherit|context-fill|context-stroke)$/i

function pushColor(counts: Map<string, number>, raw: string | null | undefined) {
  const value = (raw || '').trim()
  if (!value || NON_COLORS.test(value) || /^url\(/i.test(value)) return
  const hex = normalizeColor(value)
  if (hex) counts.set(hex, (counts.get(hex) ?? 0) + 1)
}

function cssColor(style: string, prop: string): string | null {
  const m = style.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, 'i'))
  return m ? m[1].trim() : null
}

// Near-grayscale colors (white/black/grays) are usually neutral, not brand —
// rank them after chromatic ones.
function isNeutral(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return Math.max(r, g, b) - Math.min(r, g, b) < 16
}

/**
 * Extract candidate brand colors from inline SVG markup — fill/stroke/stop-color
 * on elements, in inline styles, and in <style> blocks (class-based logos).
 * Returned as #rrggbb, chromatic colors first and most-frequent first.
 */
export function colorsFromSvg(svg: string): string[] {
  let doc: Document
  try {
    doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  } catch {
    return []
  }
  if (doc.querySelector('parsererror')) return []

  const counts = new Map<string, number>()

  for (const el of doc.querySelectorAll('*')) {
    pushColor(counts, el.getAttribute('fill'))
    pushColor(counts, el.getAttribute('stroke'))
    pushColor(counts, el.getAttribute('stop-color'))
    const style = el.getAttribute('style')
    if (style) {
      pushColor(counts, cssColor(style, 'fill'))
      pushColor(counts, cssColor(style, 'stroke'))
      pushColor(counts, cssColor(style, 'stop-color'))
    }
  }

  // CSS rules inside <style> (common in Commons logos: .cls-1 { fill:#ff4500 }).
  for (const styleEl of doc.querySelectorAll('style')) {
    const css = styleEl.textContent || ''
    for (const m of css.matchAll(/(?:fill|stroke|stop-color)\s*:\s*([^;}\s]+)/gi)) {
      pushColor(counts, m[1])
    }
  }

  return [...counts.entries()]
    .sort(byBrandThenFrequency)
    .map(([hex]) => hex)
}

function byBrandThenFrequency(
  a: [string, number],
  b: [string, number]
): number {
  const neutral = Number(isNeutral(a[0])) - Number(isNeutral(b[0]))
  return neutral !== 0 ? neutral : b[1] - a[1]
}

/** An SVG logo loaded from a file or URL, with colors extracted from it. */
export interface LogoResult {
  svg: string
  colors: string[]
}

function toLogo(text: string): LogoResult | null {
  const svg = extractInlineSvg(text)
  return svg ? {svg, colors: colorsFromSvg(svg)} : null
}

/** Read an uploaded SVG file into a stored, color-extracted logo. */
export async function fileToLogo(file: File): Promise<LogoResult | null> {
  return toLogo(await file.text())
}

/** Download an SVG URL into a stored, color-extracted logo (no hotlinking). */
export async function loadLogoFromUrl(url: string): Promise<LogoResult | null> {
  let res: Response
  try {
    res = await fetch(url, {credentials: 'omit'})
  } catch {
    return null
  }
  if (!res.ok) return null
  return toLogo(await res.text())
}
