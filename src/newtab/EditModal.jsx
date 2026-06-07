import {useEffect, useState} from 'preact/hooks'
import {DEFAULT_COLOR} from './storage.js'
import {normalizeUrl, toHex} from './util.js'
import {DialLogo} from './DialLogo.jsx'

// `target` is either {mode: 'add'} or {mode: 'edit', dial}.
export function EditModal({target, onSave, onDelete, onClose}) {
  const editing = target.mode === 'edit'
  const base = editing ? target.dial : {}

  const [name, setName] = useState(base.name || '')
  const [url, setUrl] = useState(base.url || '')
  const [color, setColor] = useState(toHex(base.color))
  const [svg, setSvg] = useState(base.svg || '')

  // Close on Escape.
  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const submit = (event) => {
    event.preventDefault()
    const cleanName = name.trim()
    const cleanUrl = normalizeUrl(url)
    if (!cleanName || !cleanUrl) return
    onSave(
      {name: cleanName, url: cleanUrl, color, svg: svg.trim()},
      editing ? target.dial.id : null
    )
  }

  const preview = {name, color, svg}

  return (
    <div
      class="modal_backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <form class="modal_card" onSubmit={submit}>
        <h2 class="modal_title">{editing ? 'Edit site' : 'Add a site'}</h2>

        <div class="modal_body">
          <div class="modal_fields">
            <label class="modal_field">
              <span class="modal_label">Name</span>
              <input
                class="modal_input"
                type="text"
                placeholder="YouTube"
                value={name}
                autofocus
                onInput={(event) => setName(event.currentTarget.value)}
              />
            </label>

            <label class="modal_field">
              <span class="modal_label">URL</span>
              <input
                class="modal_input"
                type="text"
                placeholder="youtube.com"
                value={url}
                onInput={(event) => setUrl(event.currentTarget.value)}
              />
            </label>

            <label class="modal_field">
              <span class="modal_label">Background color</span>
              <input
                class="modal_color"
                type="color"
                value={color}
                onInput={(event) => setColor(event.currentTarget.value)}
              />
            </label>

            <label class="modal_field">
              <span class="modal_label">Logo SVG</span>
              <textarea
                class="modal_textarea"
                rows={5}
                placeholder="<svg viewBox=&quot;0 0 24 24&quot;>…</svg>"
                value={svg}
                spellcheck={false}
                onInput={(event) => setSvg(event.currentTarget.value)}
              />
            </label>
          </div>

          <div class="modal_previewWrap">
            <span class="modal_label">Preview</span>
            <div class="cell cell--preview">
              <div class="tile" style={{'--dial-color': color || DEFAULT_COLOR}}>
                <DialLogo dial={preview} />
              </div>
              <span class="cell_label">{name || 'Preview'}</span>
            </div>
          </div>
        </div>

        <div class="modal_actions">
          {editing && (
            <button
              class="btn btn--danger"
              type="button"
              onClick={() => onDelete(target.dial.id)}
            >
              Delete
            </button>
          )}
          <div class="modal_spacer" />
          <button class="btn" type="button" onClick={onClose}>
            Cancel
          </button>
          <button class="btn btn--primary" type="submit">
            Save
          </button>
        </div>
      </form>
    </div>
  )
}
