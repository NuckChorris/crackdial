import {useEffect, useLayoutEffect, useRef, useState} from 'preact/hooks'
import {DownloadIcon, EditIcon, UploadIcon} from '#/newtab/shared/icons'
import * as styles from './EditControls.module.css'

interface EditControlsProps {
  editMode: boolean
  onToggle: () => void
  onExport: () => void
  onImport: (file: File) => void
}

type TipId = 'import' | 'export' | 'toggle'

// Fixed bottom-right cluster: an unobtrusive edit-mode toggle, plus
// import/export buttons that appear to its left while edit mode is on. One
// shared tooltip "follows the leader": whichever button is active holds
// `anchor-name: --hovered`, and the tooltip anchored to `--hovered` slides
// between them (see EditControls.module.css).
export function EditControls({
  editMode,
  onToggle,
  onExport,
  onImport
}: EditControlsProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  // The shared tooltip's anchor stays pinned to the last-hovered button, and
  // `visible` fades it in/out independently. Keeping the anchor through the
  // fade-out is what stops the bubble from jumping somewhere odd as it leaves —
  // it's only re-targeted on the next hover.
  const [anchorId, setAnchorId] = useState<TipId | null>(null)
  const [visible, setVisible] = useState(false)

  // Previous frame's state, so we only *slide* when re-targeting between two
  // buttons that are both already on screen — first show and re-show after a
  // dismiss fade in place instead of flying in from the old anchor.
  const prevVisible = useRef(false)
  const prevAnchor = useRef<TipId | null>(null)
  const prevLabel = useRef('')
  useEffect(() => {
    prevVisible.current = visible
    prevAnchor.current = anchorId
    prevLabel.current = label
  })

  const labels: Record<TipId, string> = {
    import: 'Import sites…',
    export: 'Export sites…',
    toggle: editMode ? 'Done editing' : 'Edit sites'
  }
  const label = anchorId ? labels[anchorId] : ''
  const sliding =
    visible && prevVisible.current && anchorId !== prevAnchor.current
  // Last render's label, kept one frame so it can fade out as the new one fades
  // in (a true crossfade). prevLabel is updated after paint, below.
  const leaving = prevLabel.current

  // Two measured customs the CSS can't derive on its own:
  //  --tip-half:  half the bubble's width, so it can clamp inside the viewport's
  //               right edge (the rightmost button would otherwise overflow).
  //  --tip-shift: how far that clamp pushed the bubble off the button's centre,
  //               so the tail can shift back by the same amount and keep
  //               pointing at the button. 0 whenever the bubble stays centred.
  // CSS can't express either (no way to reference an element's own width in an
  // inset, and the tail pseudo can't anchor across the body's filter), so we
  // measure each label and set them here.
  const barRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLSpanElement>(null)
  const tipTextRef = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const tip = tipRef.current
    const bar = barRef.current
    const text = tipTextRef.current
    if (!tip || !bar || !text || !anchorId) return
    // Pin the bubble to the label's natural width (the nowrap text plus the
    // box's own padding + border) so `width` can transition between labels.
    const box = getComputedStyle(tip)
    const frame =
      parseFloat(box.paddingLeft) +
      parseFloat(box.paddingRight) +
      parseFloat(box.borderLeftWidth) +
      parseFloat(box.borderRightWidth)
    const width = text.offsetWidth + frame
    const half = width / 2
    tip.style.setProperty('--tip-w', `${width}px`)
    tip.style.setProperty('--tip-half', `${half}px`)

    const btn = bar.querySelector<HTMLElement>(`[data-tip-id="${anchorId}"]`)
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const center = rect.left + rect.width / 2
    const margin = 8 // matches the 0.5rem inset in the clamp
    const shift = Math.max(0, center - (window.innerWidth - margin - half))
    tip.style.setProperty('--tip-shift', `${shift}px`)
  }, [label, anchorId])

  const point = (id: TipId) => ({
    onMouseEnter: () => {
      setAnchorId(id)
      setVisible(true)
    },
    onFocus: () => {
      setAnchorId(id)
      setVisible(true)
    }
  })
  const btnClass = (id: TipId, extra = '') =>
    `${styles.btn}${extra ? ` ${extra}` : ''}${anchorId === id ? ` ${styles.btnActive}` : ''}`

  return (
    <div
      ref={barRef}
      class={`${styles.bar}${editMode ? ` ${styles.editing}` : ''}`}
      onMouseLeave={() => setVisible(false)}
      onFocusOut={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setVisible(false)
        }
      }}
    >
      {editMode && (
        <>
          <button
            type="button"
            data-tip-id="import"
            class={btnClass('import')}
            aria-label="Import sites from a file"
            {...point('import')}
            onClick={() => fileRef.current?.click()}
          >
            <UploadIcon />
          </button>
          <button
            type="button"
            data-tip-id="export"
            class={btnClass('export')}
            aria-label="Export sites to a file"
            {...point('export')}
            onClick={onExport}
          >
            <DownloadIcon />
          </button>
        </>
      )}

      <button
        type="button"
        data-tip-id="toggle"
        class={btnClass('toggle', editMode ? styles.btnOn : '')}
        aria-label={labels.toggle}
        aria-pressed={editMode}
        {...point('toggle')}
        onClick={onToggle}
      >
        <EditIcon />
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        class={styles.file}
        onChange={(event) => {
          const input = event.currentTarget as HTMLInputElement
          const file = input.files?.[0]
          input.value = '' // allow re-selecting the same file
          if (file) onImport(file)
        }}
      />

      {/* One shared tooltip that follows the active button: the bubble (with an
          ::after tail) slides between buttons and clamps to stay on screen,
          while --tip-shift keeps the tail pointing at the button. The label
          crossfades: the incoming text fades in (and sizes the bubble) while
          the outgoing text is laid over it and fades out. */}
      <span
        ref={tipRef}
        class={`${styles.tip}${visible ? ` ${styles.tipVisible}` : ''}${
          sliding ? ` ${styles.tipSliding}` : ''
        }`}
        aria-hidden="true"
      >
        <span ref={tipTextRef} class={styles.tipText} key={label}>
          {label}
        </span>
        {leaving && leaving !== label && (
          <span
            class={`${styles.tipText} ${styles.tipTextLeaving}`}
            key={`leaving-${leaving}`}
          >
            {leaving}
          </span>
        )}
      </span>
    </div>
  )
}
