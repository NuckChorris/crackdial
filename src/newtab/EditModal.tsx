import {useEffect, useState} from 'preact/hooks'
import {DEFAULT_COLOR, DEFAULT_FOREGROUND} from '#/newtab/storage'
import {normalizeUrl, toHex} from '#/newtab/util'
import {DialLogo} from '#/newtab/DialLogo'
import {ColorField} from '#/newtab/ColorField'
import {BG_PALETTE, FG_PALETTE} from '#/newtab/palette'
import {gatherSuggestions} from '#/newtab/providers/registry'
import type {Suggestions} from '#/newtab/providers/types'
import type {DialDraft, ModalTarget} from '#/newtab/types'

// Keep first occurrence of each color (case-insensitive), preserving order.
function dedupeColors(colors: string[]): string[] {
  const seen = new Set<string>()
  return colors.filter((c) => {
    const key = c.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

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
  const [foreground, setForeground] = useState(
    dial?.foreground ?? DEFAULT_FOREGROUND
  )
  const [svg, setSvg] = useState(dial?.svg ?? '')

  const [busy, setBusy] = useState(false)
  const [suggestError, setSuggestError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null)

  // Background swatches: colors discovered from the site (if any) first, then
  // the default palette.
  const bgSwatches = dedupeColors([
    ...(suggestions?.colors.map((c) => c.color) ?? []),
    ...BG_PALETTE
  ])

  const autofill = async () => {
    const target = normalizeUrl(url)
    if (!target) return
    setBusy(true)
    setSuggestError(null)
    try {
      const found = await gatherSuggestions(target)
      setSuggestions(found)
      if (found.icons.length === 0 && found.colors.length === 0) {
        setSuggestError('No icon or color found on that site.')
      } else {
        // Apply the top suggestion automatically; the chips let you switch.
        if (!svg.trim() && found.icons[0]) setSvg(found.icons[0].svg)
        if (found.colors[0]) setColor(found.colors[0].color)
      }
    } catch {
      setSuggestError('Could not read that site.')
    } finally {
      setBusy(false)
    }
  }

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
    onSave(
      {name: cleanName, url: cleanUrl, color, foreground, svg: svg.trim()},
      dial?.id ?? null
    )
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

            <div class="autofill">
              <button
                type="button"
                class="btn autofill_btn"
                disabled={!normalizeUrl(url) || busy}
                onClick={autofill}
              >
                {busy ? 'Reading site…' : '✨ Auto-fill from site'}
              </button>

              {suggestError && <p class="autofill_error">{suggestError}</p>}

              {suggestions && suggestions.icons.length > 0 && (
                <div class="autofill_group">
                  <span class="modal_label">Suggested icons</span>
                  <div class="autofill_chips">
                    {suggestions.icons.map((icon, i) => (
                      <button
                        key={i}
                        type="button"
                        class="autofill_icon"
                        title={icon.source}
                        onClick={() => setSvg(icon.svg)}
                        dangerouslySetInnerHTML={{__html: icon.svg}}
                      />
                    ))}
                  </div>
                </div>
              )}

            </div>

            <ColorField
              label="Background color"
              value={color}
              swatches={bgSwatches}
              onChange={setColor}
            />

            <ColorField
              label="Text color"
              value={foreground}
              swatches={FG_PALETTE}
              onChange={setForeground}
            />

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
              <div
                class="tile"
                style={`--dial-color: ${color || DEFAULT_COLOR}; --dial-fg: ${foreground || DEFAULT_FOREGROUND}`}
              >
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
