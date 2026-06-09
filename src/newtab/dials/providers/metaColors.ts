import type {ColorSuggestion, Provider} from '#/newtab/dials/providers/types'
import {normalizeColor} from '#/newtab/dials/providers/helpers'

// Accent colors declared in <meta> tags. `theme-color` is the standard one;
// the msapplication-* tags are common legacy fallbacks.
const META_COLOR_NAMES = [
  'theme-color',
  'msapplication-TileColor',
  'msapplication-navbutton-color'
]

export const metaColorsProvider: Provider = {
  name: 'meta-color',
  async collect({doc}) {
    const colors: ColorSuggestion[] = []
    for (const name of META_COLOR_NAMES) {
      for (const meta of doc.querySelectorAll(`meta[name="${name}"]`)) {
        const color = normalizeColor(meta.getAttribute('content'))
        if (color) colors.push({color, source: name})
      }
    }
    return {colors}
  }
}
