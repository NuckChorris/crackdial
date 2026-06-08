import {DEFAULT_COLOR, DEFAULT_FOREGROUND, DEFAULT_SCALE} from '#/newtab/storage'
import {normalizeUrl} from '#/newtab/util'
import {DialLogo} from '#/newtab/DialLogo'
import {EditIcon, PlusIcon} from '#/newtab/icons'
import type {SpeedDial} from '#/newtab/types'

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
      class="cell"
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
        class={`tile${rainbow ? ' tile--rainbow' : ''}`}
        style={`--dial-color: ${dial.color || DEFAULT_COLOR}${rainbow ? '' : `; --dial-fg: ${fg}`}; --logo-scale: ${dial.scale ?? DEFAULT_SCALE}; ${wiggleVars(dial.id)}`}
      >
        {editMode && (
          <button
            class="tile_edit"
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
      <span class="cell_label">{dial.name}</span>
    </div>
  )
}

interface AddCellProps {
  onAdd: () => void
}

function AddCell({onAdd}: AddCellProps) {
  return (
    <div
      class="cell"
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
      <div class="tile tile--add">
        <span class="tile_logo">
          <PlusIcon />
        </span>
      </div>
      <span class="cell_label">Add a site</span>
    </div>
  )
}

interface SpeedDialGridProps {
  dials: SpeedDial[]
  editMode: boolean
  onAdd: () => void
  onEdit: (id: string) => void
}

export function SpeedDialGrid({dials, editMode, onAdd, onEdit}: SpeedDialGridProps) {
  return (
    <div class={`grid${editMode ? ' grid--edit' : ''}`}>
      {dials.map((dial) => (
        <DialCell key={dial.id} dial={dial} editMode={editMode} onEdit={onEdit} />
      ))}
      {editMode && <AddCell onAdd={onAdd} />}
    </div>
  )
}
