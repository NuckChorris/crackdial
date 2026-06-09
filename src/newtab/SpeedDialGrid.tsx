import {useEffect, useRef} from 'preact/hooks'
import Sortable from 'sortablejs'
import {DEFAULT_COLOR, DEFAULT_FOREGROUND, DEFAULT_SCALE} from '#/newtab/storage'
import {normalizeUrl} from '#/newtab/util'
import {DialLogo} from '#/newtab/DialLogo'
import {EditIcon, PlusIcon} from '#/newtab/icons'
import type {SpeedDial} from '#/newtab/types'
import * as styles from './SpeedDialGrid.module.css'

// Per-dial wiggle timing for edit mode. Derived from the id so it's stable
// across re-renders (no reshuffle on every keystroke) yet varies card-to-card:
// staggered phase (negative delay) + jittered duration/amplitude make the
// iOS-style jiggle read as random rather than a synchronized march.
function wiggleVars(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (Math.imul(h, 31) + id.charCodeAt(i)) >>> 0
  const dur = 0.3 + (h % 9) * 0.012 // 0.300–0.396s
  const delay = -(((h >>> 4) % 400) / 1000) // -0.000 to -0.399s
  const rot = 1.0 + ((h >>> 9) % 9) * 0.1 // 1.0–1.8deg
  return `--wiggle-dur: ${dur.toFixed(3)}s; --wiggle-delay: ${delay.toFixed(3)}s; --wiggle-rot: ${rot.toFixed(2)}deg`
}

interface DialCellProps {
  dial: SpeedDial
  editMode: boolean
  onEdit: (id: string) => void
}

function DialCell({dial, editMode, onEdit}: DialCellProps) {
  const go = () => {
    const url = normalizeUrl(dial.url)
    if (url) window.location.href = url
  }

  // In edit mode the whole tile is the edit target; otherwise it's the link.
  const activate = () => (editMode ? onEdit(dial.id) : go())

  const fg = dial.foreground || DEFAULT_FOREGROUND
  const rainbow = fg === 'rainbow'

  return (
    <div
      class={styles.cell}
      data-id={dial.id}
      tabindex={0}
      title={editMode ? `Edit ${dial.name}` : dial.name}
      onClick={activate}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          activate()
        }
      }}
    >
      <div
        class={`${styles.tile}${rainbow ? ` ${styles.rainbow}` : ''}`}
        style={`--dial-color: ${dial.color || DEFAULT_COLOR}${rainbow ? '' : `; --dial-fg: ${fg}`}; --logo-scale: ${dial.scale ?? DEFAULT_SCALE}; ${wiggleVars(dial.id)}`}
      >
        {editMode && (
          <button
            class={styles.edit}
            type="button"
            title="Edit"
            aria-label={`Edit ${dial.name}`}
            onClick={(event) => {
              event.stopPropagation()
              onEdit(dial.id)
            }}
          >
            <EditIcon />
          </button>
        )}
        <DialLogo dial={dial} />
      </div>
      <span class={styles.label}>{dial.name}</span>
    </div>
  )
}

interface AddCellProps {
  onAdd: () => void
}

function AddCell({onAdd}: AddCellProps) {
  return (
    <div
      class={`${styles.cell} ${styles.cellAdd}`}
      tabindex={0}
      title="Add a site"
      onClick={onAdd}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          onAdd()
        }
      }}
    >
      <div class={`${styles.tile} ${styles.tileAdd}`}>
        <span class={styles.logo}>
          <PlusIcon />
        </span>
      </div>
      <span class={styles.label}>Add a site</span>
    </div>
  )
}

interface SpeedDialGridProps {
  dials: SpeedDial[]
  editMode: boolean
  onAdd: () => void
  onEdit: (id: string) => void
  onReorder: (from: number, to: number) => void
}

export function SpeedDialGrid({
  dials,
  editMode,
  onAdd,
  onEdit,
  onReorder
}: SpeedDialGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)

  // Drag-to-reorder, edit mode only. SortableJS mutates the DOM on drop; we undo
  // that move and drive the reorder through state instead, so Preact stays the
  // single source of truth (otherwise its next render fights Sortable's DOM).
  useEffect(() => {
    const el = gridRef.current
    if (!editMode || !el) return

    const sortable = Sortable.create(el, {
      animation: 150,
      forceFallback: true, // consistent drag visuals + touch support
      draggable: `.${styles.cell}`,
      filter: `.${styles.cellAdd}`, // the "Add a site" tile isn't draggable
      ghostClass: styles.ghost,
      chosenClass: styles.chosen,
      dragClass: styles.drag,
      // Don't let a dragged tile land relative to the (pinned) add tile.
      onMove: (evt) => !evt.related.classList.contains(styles.cellAdd),
      onEnd: (evt) => {
        const {oldIndex, newIndex, item, from} = evt
        if (oldIndex == null || newIndex == null || oldIndex === newIndex) return
        // Revert Sortable's DOM move (put `item` back at oldIndex), then let the
        // state update re-render the cells in the new order.
        const ref: Element | null =
          (newIndex > oldIndex
            ? from.children[oldIndex]
            : from.children[oldIndex + 1]) ?? null
        from.insertBefore(item, ref)
        onReorder(oldIndex, newIndex)
      }
    })

    return () => sortable.destroy()
  }, [editMode, onReorder])

  return (
    <div ref={gridRef} class={`${styles.grid}${editMode ? ` ${styles.editing}` : ''}`}>
      {dials.map((dial) => (
        <DialCell key={dial.id} dial={dial} editMode={editMode} onEdit={onEdit} />
      ))}
      {editMode && <AddCell onAdd={onAdd} />}
    </div>
  )
}
