import {DEFAULT_COLOR} from './storage.js'
import {normalizeUrl} from './util.js'
import {DialLogo} from './DialLogo.jsx'
import {EditIcon, PlusIcon} from './icons.jsx'

function DialCell({dial, onEdit}) {
  const go = () => {
    const url = normalizeUrl(dial.url)
    if (url) window.location.href = url
  }

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
      <div class="tile" style={{'--dial-color': dial.color || DEFAULT_COLOR}}>
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

function AddCell({onAdd}) {
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

export function SpeedDialGrid({dials, onAdd, onEdit}) {
  return (
    <div class="grid">
      {dials.map((dial) => (
        <DialCell key={dial.id} dial={dial} onEdit={onEdit} />
      ))}
      <AddCell onAdd={onAdd} />
    </div>
  )
}
