import {useEffect, useState} from 'preact/hooks'
import {DEFAULT_COLOR, DEFAULT_FOREGROUND, DEFAULT_SCALE} from '#/newtab/storage'
import {normalizeUrl, toHex} from '#/newtab/util'
import {DialLogo} from '#/newtab/DialLogo'
import {ColorField} from '#/newtab/ColorField'
import {FG_PALETTE, RAINBOW} from '#/newtab/palette'
import {extractInlineSvg} from '#/newtab/providers/helpers'
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
  const [image, setImage] = useState(dial?.image ?? '')
  const [scale, setScale] = useState(dial?.scale ?? DEFAULT_SCALE)

  const [busy, setBusy] = useState(false)
  const [suggestError, setSuggestError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null)

  // Colors discovered on the site (incl. those extracted from logos).
  const discovered = suggestions?.colors.map((c) => c.color) ?? []
  // Background: just the discovered colors + custom picker.
  const bgSwatches = dedupeColors(discovered)
  // Foreground: the basics, then discovered colors (for bicolor lockups), then
  // rainbow last.
  const fgSwatches = dedupeColors([
    ...FG_PALETTE.filter((c) => c !== RAINBOW),
    ...discovered,
    RAINBOW
  ])
  const previewRainbow = foreground === RAINBOW

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
        if (!svg.trim() && !image && found.icons[0]) pickSvg(found.icons[0].svg)
        if (found.colors[0]) setColor(found.colors[0].color)
      }
    } catch {
      setSuggestError('Could not read that site.')
    } finally {
      setBusy(false)
    }
  }

  // svg and image are mutually exclusive representations of the logo.
  const pickSvg = (markup: string) => {
    setSvg(markup)
    setImage('')
  }
  const pickImage = (src: string) => {
    setImage(src)
    if (src) setSvg('')
  }

  const onUpload = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    if (file.type === 'image/svg+xml' || /\.svg$/i.test(file.name)) {
      // Inline SVG files so they stay recolorable.
      reader.onload = () => {
        const markup = extractInlineSvg(String(reader.result))
        if (markup) pickSvg(markup)
      }
      reader.readAsText(file)
    } else {
      reader.onload = () => pickImage(String(reader.result))
      reader.readAsDataURL(file)
    }
    input.value = '' // allow re-selecting the same file
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
      {
        name: cleanName,
        url: cleanUrl,
        color,
        foreground,
        svg: svg.trim(),
        image: image.trim(),
        scale
      },
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
                        onClick={() => pickSvg(icon.svg)}
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
              label="Foreground color"
              value={foreground}
              swatches={fgSwatches}
              onChange={setForeground}
            />

            <div class="modal_field">
              <span class="modal_label">Logo</span>
              <div class="logo_input">
                <label class="btn logo_upload">
                  Upload…
                  <input
                    class="logo_file"
                    type="file"
                    accept="image/*"
                    onChange={onUpload}
                  />
                </label>
                <input
                  class="modal_input"
                  type="url"
                  placeholder="…or paste an image URL"
                  value={image.startsWith('data:') ? '' : image}
                  onInput={(event) => pickImage(event.currentTarget.value.trim())}
                />
              </div>
            </div>

            <label class="modal_field">
              <span class="modal_label">Logo size · {Math.round(scale * 100)}%</span>
              <input
                class="modal_range"
                type="range"
                min="0.5"
                max="2"
                step="0.05"
                value={scale}
                onInput={(event) => setScale(Number(event.currentTarget.value))}
              />
            </label>
          </div>

          <div class="modal_previewWrap">
            <span class="modal_label">Preview</span>
            <div class="cell cell--preview">
              <div
                class={`tile${previewRainbow ? ' tile--rainbow' : ''}`}
                style={`--dial-color: ${color || DEFAULT_COLOR}${previewRainbow ? '' : `; --dial-fg: ${foreground || DEFAULT_FOREGROUND}`}; --logo-scale: ${scale}`}
              >
                <DialLogo dial={{name, svg, image}} />
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
