// A single speed-dial entry shown in the grid.
export interface SpeedDial {
  id: string
  name: string
  url: string
  /** Background color as #rrggbb. */
  color: string
  /**
   * Foreground color as #rrggbb — applied as the tile's CSS color, so it tints
   * the monogram fallback and any `currentColor` SVGs. Optional for dials saved
   * before this field existed.
   */
  foreground?: string
  /** Raw inline SVG markup for the logo, or '' for a monogram fallback. */
  svg: string
}

/** The editable fields of a dial (everything except its id). */
export type DialDraft = Omit<SpeedDial, 'id'>

/** What the edit modal is currently doing. */
export type ModalTarget =
  | {mode: 'add'}
  | {mode: 'edit'; dial: SpeedDial}
