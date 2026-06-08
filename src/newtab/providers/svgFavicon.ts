import type {Provider} from '#/newtab/providers/types'
import {fetchSvg, resolveUrl} from '#/newtab/providers/helpers'

// Modern SVG favicon:
//   <link rel="icon" type="image/svg+xml" href="/favicon.svg">
export const svgFaviconProvider: Provider = {
  name: 'svg-favicon',
  async collect({url, doc, fetchText}) {
    const links = [...doc.querySelectorAll('link[rel~="icon"]')]
    const svgLink = links.find((link) => {
      const type = link.getAttribute('type')
      const href = link.getAttribute('href') || ''
      return type === 'image/svg+xml' || /\.svg(\?|#|$)/i.test(href)
    })

    const href = svgLink?.getAttribute('href')
    const resolved = href ? resolveUrl(href, url) : null
    if (!resolved) return {}

    const svg = await fetchSvg(fetchText, resolved)
    return svg ? {icons: [{svg, source: 'svg-favicon'}]} : {}
  }
}
