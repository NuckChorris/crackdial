import {useEffect, useState} from 'preact/hooks'
import {DEFAULT_COLOR} from '#/newtab/storage'
import {normalizeUrl, toHex} from '#/newtab/util'
import {DialLogo} from '#/newtab/DialLogo'
import type {DialDraft, ModalTarget} from '#/newtab/types'

interface EditModalProps {
  target: ModalTarget
  onSave: (data: DialDraft, id: string | null) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export function EditModal({target, onSave, onDelete, onClose}: EditModalProps) {
  const dial = target.mode === 'edit' ? target.dial : null

  const [name, setName] = useState(dial?.name ?? '')
  const [url, setUrl] = useState(dial?.url ?? '')
  const [color, setColor] = useState(toHex(dial?.color))
  const [svg, setSvg] = useState(dial?.svg ?? '')

  // Close on Escape.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const submit = (event: Event) => {
    event.preventDefault()
    const cleanName = name.trim()
    const cleanUrl = normalizeUrl(url)
    if (!cleanName || !cleanUrl) return
    onSave({name: cleanName, url: cleanUrl, color, svg: svg.trim()}, dial?.id ?? null)
  }

  return (
    <div
      class="modal_backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <form class="modal_card" onSubmit={submit}>
        <h2 class="modal_title">{dial ? 'Edit site' : 'Add a site'}</h2>

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
              <div class="tile" style={`--dial-color: ${color || DEFAULT_COLOR}`}>
                <DialLogo dial={{name, svg}} />
              </div>
              <span class="cell_label">{name || 'Preview'}</span>
            </div>
          </div>
        </div>

        <div class="modal_actions">
          {dial && (
            <button class="btn btn--danger" type="button" onClick={() => onDelete(dial.id)}>
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
