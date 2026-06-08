import {useRef} from 'preact/hooks'
import {PlusIcon} from '#/newtab/icons'
import {toHex} from '#/newtab/util'

interface ColorFieldProps {
  label: string
  value: string
  /** Suggested swatches to show as circles, in order. */
  swatches: string[]
  onChange: (color: string) => void
}

// A row of selectable swatch circles followed by an "Other" (+) that opens the
// native color picker. When the value isn't one of the swatches, the Other
// circle shows the custom color and is marked selected.
export function ColorField({label, value, swatches, onChange}: ColorFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const current = value.toLowerCase()
  const isCustom = !swatches.some((c) => c.toLowerCase() === current)

  return (
    <div class="colorfield">
      <span class="modal_label">{label}</span>
      <div class="swatches">
        {swatches.map((swatch) => (
          <button
            key={swatch}
            type="button"
            class={`swatch${swatch.toLowerCase() === current ? ' swatch--on' : ''}`}
            style={`--swatch:${swatch}`}
            title={swatch}
            aria-label={`${label}: ${swatch}`}
            onClick={() => onChange(swatch)}
          />
        ))}

        <button
          type="button"
          class={`swatch swatch--other${isCustom ? ' swatch--on' : ''}`}
          style={isCustom ? `--swatch:${value}` : undefined}
          title="Custom color…"
          aria-label={`${label}: custom color`}
          onClick={() => inputRef.current?.click()}
        >
          {!isCustom && <PlusIcon />}
        </button>

        <input
          ref={inputRef}
          type="color"
          class="swatch_input"
          value={toHex(value)}
          tabindex={-1}
          aria-hidden="true"
          onInput={(event) => onChange(event.currentTarget.value)}
        />
      </div>
    </div>
  )
}
