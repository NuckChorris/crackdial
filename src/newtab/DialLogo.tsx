import * as styles from './SpeedDialGrid.module.css'

interface DialLogoProps {
  dial: {name?: string; svg?: string}
}

// Renders a dial's logo: the inline SVG, or a letter monogram fallback when no
// SVG is set. Shared by the grid tiles and the modal preview, so the styles
// live in the grid module (the recolor/monogram rules compound with .tile).
export function DialLogo({dial}: DialLogoProps) {
  const svg = (dial.svg || '').trim()
  if (svg) {
    return <span class={styles.logo} dangerouslySetInnerHTML={{__html: svg}} />
  }

  const letter = (dial.name || '?').trim().charAt(0).toUpperCase() || '?'
  return (
    <span class={styles.logo}>
      <span class={styles.monogram}>{letter}</span>
    </span>
  )
}
