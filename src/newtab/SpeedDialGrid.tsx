import {DEFAULT_COLOR, DEFAULT_FOREGROUND, DEFAULT_SCALE} from '#/newtab/storage'
import {normalizeUrl} from '#/newtab/util'
import {DialLogo} from '#/newtab/DialLogo'
import {EditIcon, PlusIcon} from '#/newtab/icons'
import type {SpeedDial} from '#/newtab/types'

interface DialCellProps {
  dial: SpeedDial
  onEdit: (id: string) => void
}

function DialCell({dial, onEdit}: DialCellProps) {
  const go = () => {
    const url = normalizeUrl(dial.url)
    if (url) window.location.href = url
  }

  const fg = dial.foreground || DEFAULT_FOREGROUND
  const rainbow = fg === 'rainbow'

  return (
    <div
      class="cell"
      tabindex={0}
      title={dial.name}
      onClick={go}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          go()
        }
      }}
    >
      <div
        class={`tile${rainbow ? ' tile--rainbow' : ''}`}
        style={`--dial-color: ${dial.color || DEFAULT_COLOR}${rainbow ? '' : `; --dial-fg: ${fg}`}; --logo-scale: ${dial.scale ?? DEFAULT_SCALE}`}
      >
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
  onAdd: () => void
  onEdit: (id: string) => void
}

export function SpeedDialGrid({dials, onAdd, onEdit}: SpeedDialGridProps) {
  return (
    <div class="grid">
      {dials.map((dial) => (
        <DialCell key={dial.id} dial={dial} onEdit={onEdit} />
      ))}
      <AddCell onAdd={onAdd} />
    </div>
  )
}
