interface DialLogoProps {
  dial: {name?: string; svg?: string; image?: string}
}

// Renders a dial's logo, in priority order: inline SVG (recolorable), an image
// (uploaded file / URL), or a letter monogram. Shared by the grid tiles and the
// modal preview.
export function DialLogo({dial}: DialLogoProps) {
  const svg = (dial.svg || '').trim()
  if (svg) {
    return <span class="tile_logo" dangerouslySetInnerHTML={{__html: svg}} />
  }

  if (dial.image) {
    return (
      <span class="tile_logo">
        <img class="tile_img" src={dial.image} alt="" />
      </span>
    )
  }

  const letter = (dial.name || '?').trim().charAt(0).toUpperCase() || '?'
  return (
    <span class="tile_logo">
      <span class="tile_monogram">{letter}</span>
    </span>
  )
}
