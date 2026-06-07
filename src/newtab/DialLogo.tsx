interface DialLogoProps {
  dial: {name?: string; svg?: string}
}

// Renders a dial's logo: the user-supplied SVG markup, or a letter monogram
// fallback when no SVG is set. Shared by the grid tiles and the modal preview.
export function DialLogo({dial}: DialLogoProps) {
  const svg = (dial.svg || '').trim()
  if (svg) {
    return <span class="tile_logo" dangerouslySetInnerHTML={{__html: svg}} />
  }
  const letter = (dial.name || '?').trim().charAt(0).toUpperCase() || '?'
  return (
    <span class="tile_logo">
      <span class="tile_monogram">{letter}</span>
    </span>
  )
}
