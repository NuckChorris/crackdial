import type {Provider, Suggestions} from '#/newtab/providers/types'
import {fetchSvg, normalizeColor, resolveUrl} from '#/newtab/providers/helpers'

// Safari pinned-tab icon — the ideal source, since it carries both a
// monochrome SVG and an accent color:
//   <link rel="mask-icon" href="/icon.svg" color="#ff0000">
export const maskIconProvider: Provider = {
  name: 'mask-icon',
  async collect({url, doc, fetchText}) {
    const link = doc.querySelector('link[rel~="mask-icon"]')
    if (!link) return {}

    const out: Suggestions = {icons: [], colors: []}

    const color = normalizeColor(link.getAttribute('color'))
    if (color) out.colors.push({color, source: 'mask-icon'})

    const href = link.getAttribute('href')
    const resolved = href ? resolveUrl(href, url) : null
    if (resolved) {
      const svg = await fetchSvg(fetchText, resolved)
      if (svg) out.icons.push({svg, source: 'mask-icon'})
    }

    return out
  }
}
