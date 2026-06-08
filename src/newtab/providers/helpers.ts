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

/** Fetch an SVG file and return sanitized <svg>…</svg> markup, or null. */
export async function fetchSvg(
  fetchText: SiteContext['fetchText'],
  url: string
): Promise<string | null> {
  const text = await fetchText(url)
  if (!text) return null
  const start = text.indexOf('<svg')
  const end = text.lastIndexOf('</svg>')
  if (start < 0 || end < 0) return null
  return sanitizeSvg(text.slice(start, end + '</svg>'.length))
}
