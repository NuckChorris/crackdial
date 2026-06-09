import {useRef} from 'preact/hooks'
import {PlusIcon} from '#/newtab/shared/icons'
import {toHex} from '#/newtab/shared/util'
import {RAINBOW} from '#/newtab/shared/palette'
import * as styles from './ColorField.module.css'

interface ColorFieldProps {
  label: string
  value: string
  /** Suggested swatches to show as circles, in order. May include RAINBOW. */
  swatches: string[]
  onChange: (value: string) => void
}

// A row of selectable swatch circles ending in an "Other" (+) that opens the
// native picker — ( ) ( ) (+). The current value is shown as its own swatch
// when it isn't already one of the provided swatches.
export function ColorField({label, value, swatches, onChange}: ColorFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const lower = value.toLowerCase()
  const known = swatches.some((s) => s.toLowerCase() === lower)
  const showCurrent = !known && value !== RAINBOW

  const openPicker = () => inputRef.current?.click()

  return (
    <div class={styles.field}>
      <span class={styles.label}>{label}</span>
      <div class={styles.swatches}>
        {swatches.map((swatch) => (
          <Swatch
            key={swatch}
            swatch={swatch}
            selected={swatch.toLowerCase() === lower}
            label={label}
            onClick={() => onChange(swatch)}
          />
        ))}

        {showCurrent && (
          <Swatch swatch={value} selected label={label} onClick={openPicker} />
        )}

        <button
          type="button"
          class={`${styles.swatch} ${styles.other}`}
          title="Custom color…"
          aria-label={`${label}: custom color`}
          onClick={openPicker}
        >
          <PlusIcon />
        </button>

        <input
          ref={inputRef}
          type="color"
          class={styles.input}
          value={toHex(value)}
          tabindex={-1}
          aria-hidden="true"
          onInput={(event) => onChange(event.currentTarget.value)}
        />
      </div>
    </div>
  )
}

interface SwatchProps {
  swatch: string
  selected: boolean
  label: string
  onClick: () => void
}

function Swatch({swatch, selected, label, onClick}: SwatchProps) {
  const rainbow = swatch === RAINBOW
  return (
    <button
      type="button"
      class={`${styles.swatch}${rainbow ? ` ${styles.rainbow}` : ''}${selected ? ` ${styles.on}` : ''}`}
      style={rainbow ? undefined : `--swatch:${swatch}`}
      title={rainbow ? 'Rainbow' : swatch}
      aria-label={`${label}: ${rainbow ? 'rainbow' : swatch}`}
      onClick={onClick}
    />
  )
}
