import type {Provider, Suggestions} from '#/newtab/dials/providers/types'
import {fetchSvg, normalizeColor, resolveUrl} from '#/newtab/dials/providers/helpers'

interface WebManifestIcon {
  src?: string
  type?: string
}

interface WebManifest {
  theme_color?: string
  background_color?: string
  icons?: WebManifestIcon[]
}

// Web app manifest: theme/background colors and (occasionally) an SVG icon.
//   <link rel="manifest" href="/site.webmanifest">
export const webManifestProvider: Provider = {
  name: 'web-manifest',
  async collect({url, doc, fetchText}) {
    const href = doc.querySelector('link[rel="manifest"]')?.getAttribute('href')
    const manifestUrl = href ? resolveUrl(href, url) : null
    if (!manifestUrl) return {}

    const raw = await fetchText(manifestUrl)
    if (!raw) return {}

    let manifest: WebManifest
    try {
      manifest = JSON.parse(raw) as WebManifest
    } catch {
      return {}
    }

    const out: Suggestions = {icons: [], colors: []}

    for (const key of ['theme_color', 'background_color'] as const) {
      const color = normalizeColor(manifest[key])
      if (color) out.colors.push({color, source: `manifest:${key}`})
    }

    const svgIcon = (manifest.icons || []).find(
      (icon) => icon.type === 'image/svg+xml' || /\.svg(\?|#|$)/i.test(icon.src || '')
    )
    // Manifest icon paths are relative to the manifest, not the page.
    const iconUrl = svgIcon?.src ? resolveUrl(svgIcon.src, manifestUrl) : null
    if (iconUrl) {
      const svg = await fetchSvg(fetchText, iconUrl)
      if (svg) out.icons.push({svg, source: 'manifest-icon'})
    }

    return out
  }
}
