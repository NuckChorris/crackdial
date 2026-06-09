// Chrome ignores a `prefers-color-scheme` @media query embedded inside an SVG
// favicon (crbug.com/1311553), so icon.svg's dark-mode block never fires for
// the tab icon — Chrome always renders the light glyph. The `media` attribute
// on `<link rel="icon">` would fix Chrome but Firefox doesn't honor it, and we
// build for both. So drive the swap from JS instead: pull the master SVG once,
// pin its glyph fill to the active scheme, and re-point the <link> on every
// theme change. Uniform across Chrome, Edge, and Firefox, and live (no reload).

const FILL = {light: '#3C4043', dark: '#E8EAED'} as const

export async function initFavicon(): Promise<void> {
  const link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]')
  if (!link) return

  let master: string
  try {
    master = await (await fetch(link.href)).text()
  } catch {
    return // leave the static (light) icon in place if the asset can't be read
  }

  const dark = window.matchMedia('(prefers-color-scheme: dark)')
  const apply = () => {
    // Pin the base `.glyph` rule to the active scheme. The file's @media block
    // is left as-is: Chrome ignores it, Firefox agrees with what we set here.
    const svg = master.replace(/\.glyph\s*\{[^}]*\}/, `.glyph{fill:${dark.matches ? FILL.dark : FILL.light}}`)
    link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`
  }

  apply()
  dark.addEventListener('change', apply)
}
