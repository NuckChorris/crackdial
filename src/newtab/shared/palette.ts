// Foreground swatch options. Lowercase #rrggbb so they compare cleanly against
// stored/picked values; `RAINBOW` is a special non-color value handled by the
// tile (gradient monogram, no color override).
// Background has no preset palette — its swatches come from the site or the
// custom picker.

export const RAINBOW = 'rainbow'

export const FG_PALETTE = [
  '#ffffff', // white
  '#000000', // black
  '#e5e7eb', // light gray
  '#9ca3af', // gray
  RAINBOW
]
