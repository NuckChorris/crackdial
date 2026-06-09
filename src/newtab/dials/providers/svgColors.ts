import type {ColorSuggestion, Provider} from '#/newtab/dials/providers/types'
import {colorsFromSvg} from '#/newtab/dials/providers/helpers'

// A later-stage provider: the logos found by the icon providers carry the brand
// palette, so harvest their fills/strokes as color suggestions. Runs at stage 1
// so `ctx.collected.icons` holds every logo the stage-0 providers gathered.
export const svgColorsProvider: Provider = {
  name: 'svg-colors',
  stage: 1,
  async collect({collected}) {
    const colors: ColorSuggestion[] = []
    for (const icon of collected.icons) {
      for (const color of colorsFromSvg(icon.svg)) {
        colors.push({color, source: `${icon.source}:svg`})
      }
    }
    return {colors}
  }
}
