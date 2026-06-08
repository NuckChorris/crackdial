// A pluggable system for deriving a logo (SVG) and accent color for a website.
// Add a source by implementing `Provider` and registering it in registry.ts.

export interface IconSuggestion {
  /** Raw inline <svg> markup. */
  svg: string
  /** Which provider produced this — shown in the UI / useful for debugging. */
  source: string
}

export interface ColorSuggestion {
  /** Normalized #rrggbb. */
  color: string
  source: string
}

export interface Suggestions {
  icons: IconSuggestion[]
  colors: ColorSuggestion[]
}

/** Everything a provider needs to inspect a site. */
export interface SiteContext {
  /** The site URL the user entered (already normalized to an absolute URL). */
  url: URL
  /** The parsed homepage document. */
  doc: Document
  /** Fetch helper returning response text, or null on any failure. */
  fetchText: (url: string) => Promise<string | null>
}

/**
 * A source of icon/color suggestions for a website. Each provider is handed the
 * same SiteContext and returns whatever it can find; the registry merges and
 * de-duplicates across all of them.
 */
export interface Provider {
  name: string
  collect: (ctx: SiteContext) => Promise<Partial<Suggestions>>
}
