import './styles.css'
import {loadDials, saveDials, DEFAULT_COLOR} from './storage.js'

const KAGI_SEARCH = 'https://kagi.com/search?q='

const ICONS = {
  search:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  edit:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  plus:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
}

let dials = []
let editingId = null
let modal = null

const root = document.getElementById('root')

init()

async function init() {
  dials = await loadDials()
  if (!root) return
  root.replaceChildren(buildPage())
  modal = buildModal()
  document.body.append(modal.backdrop)
}

/* ------------------------------------------------------------------ helpers */

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(props)) {
    if (key === 'className') node.className = value
    else if (key === 'textContent') node.textContent = value
    else if (key === 'innerHTML') node.innerHTML = value
    else if (key in node) node[key] = value
    else node.setAttribute(key, value)
  }
  for (const child of [].concat(children)) {
    if (child == null) continue
    node.append(child.nodeType ? child : document.createTextNode(child))
  }
  return node
}

function normalizeUrl(url) {
  const trimmed = (url || '').trim()
  if (!trimmed) return ''
  return /^[a-z][\w+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function newId() {
  if (globalThis.crypto && crypto.randomUUID) return crypto.randomUUID()
  return `dial-${Math.floor(performance.now() * 1000)}`
}

function toHex(color) {
  return /^#[0-9a-fA-F]{6}$/.test(color || '') ? color : DEFAULT_COLOR
}

/* --------------------------------------------------------------------- page */

function buildPage() {
  return el('main', {className: 'page'}, [buildSearch(), buildGrid()])
}

function buildSearch() {
  const input = el('input', {
    className: 'search_input',
    type: 'search',
    placeholder: 'Search with Kagi',
    autocomplete: 'off',
    spellcheck: false,
    'aria-label': 'Search with Kagi'
  })

  const form = el('form', {className: 'search', role: 'search'}, [
    el('span', {className: 'search_icon', innerHTML: ICONS.search}),
    input
  ])

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const query = input.value.trim()
    if (query) window.location.href = KAGI_SEARCH + encodeURIComponent(query)
  })

  return form
}

/* --------------------------------------------------------------------- grid */

function buildGrid() {
  const grid = el('div', {className: 'grid', id: 'grid'})
  for (const dial of dials) grid.append(buildCell(dial))
  grid.append(buildAddCell())
  return grid
}

function renderGrid() {
  const existing = document.getElementById('grid')
  if (existing) existing.replaceWith(buildGrid())
}

function logoNode(dial) {
  const span = el('span', {className: 'tile_logo'})
  const svg = (dial.svg || '').trim()
  if (svg) {
    span.innerHTML = svg
  } else {
    const letter = (dial.name || '?').trim().charAt(0).toUpperCase() || '?'
    span.append(el('span', {className: 'tile_monogram', textContent: letter}))
  }
  return span
}

function buildCell(dial) {
  const tile = el('div', {className: 'tile'})
  tile.style.setProperty('--dial-color', dial.color || DEFAULT_COLOR)

  const edit = el('button', {
    className: 'tile_edit',
    type: 'button',
    title: 'Edit',
    'aria-label': `Edit ${dial.name}`,
    innerHTML: ICONS.edit
  })
  edit.addEventListener('click', (event) => {
    event.stopPropagation()
    openModal(dial.id)
  })

  tile.append(edit, logoNode(dial))

  const cell = el('div', {className: 'cell', tabIndex: 0, title: dial.name}, [
    tile,
    el('span', {className: 'cell_label', textContent: dial.name})
  ])

  const go = () => {
    const url = normalizeUrl(dial.url)
    if (url) window.location.href = url
  }
  cell.addEventListener('click', go)
  cell.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      go()
    }
  })

  return cell
}

function buildAddCell() {
  const tile = el('div', {className: 'tile tile--add'}, [
    el('span', {className: 'tile_logo', innerHTML: ICONS.plus})
  ])
  const cell = el('div', {className: 'cell', tabIndex: 0, title: 'Add a site'}, [
    tile,
    el('span', {className: 'cell_label', textContent: 'Add a site'})
  ])

  const open = () => openModal(null)
  cell.addEventListener('click', open)
  cell.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      open()
    }
  })

  return cell
}

/* -------------------------------------------------------------------- modal */

function field(labelText, control) {
  return el('label', {className: 'modal_field'}, [
    el('span', {className: 'modal_label', textContent: labelText}),
    control
  ])
}

function buildModal() {
  const nameInput = el('input', {
    className: 'modal_input',
    type: 'text',
    placeholder: 'YouTube',
    autocomplete: 'off'
  })
  const urlInput = el('input', {
    className: 'modal_input',
    type: 'text',
    placeholder: 'youtube.com',
    autocomplete: 'off'
  })
  const colorInput = el('input', {
    className: 'modal_color',
    type: 'color',
    value: DEFAULT_COLOR
  })
  const svgInput = el('textarea', {
    className: 'modal_textarea',
    rows: 5,
    placeholder: '<svg viewBox="0 0 24 24">…</svg>',
    spellcheck: false
  })

  const previewTile = el('div', {className: 'tile'})
  const previewLabel = el('span', {className: 'cell_label'})
  const preview = el('div', {className: 'cell cell--preview'}, [
    previewTile,
    previewLabel
  ])

  const updatePreview = () => {
    const data = {name: nameInput.value, color: colorInput.value, svg: svgInput.value}
    previewTile.style.setProperty('--dial-color', data.color || DEFAULT_COLOR)
    previewTile.replaceChildren(logoNode(data))
    previewLabel.textContent = data.name || 'Preview'
  }
  for (const input of [nameInput, colorInput, svgInput]) {
    input.addEventListener('input', updatePreview)
  }

  const title = el('h2', {className: 'modal_title', id: 'modal-title'})
  const deleteBtn = el('button', {
    className: 'btn btn--danger',
    type: 'button',
    textContent: 'Delete'
  })
  const cancelBtn = el('button', {
    className: 'btn',
    type: 'button',
    textContent: 'Cancel'
  })
  const saveBtn = el('button', {
    className: 'btn btn--primary',
    type: 'submit',
    textContent: 'Save'
  })

  const card = el('form', {className: 'modal_card', 'aria-labelledby': 'modal-title'}, [
    title,
    el('div', {className: 'modal_body'}, [
      el('div', {className: 'modal_fields'}, [
        field('Name', nameInput),
        field('URL', urlInput),
        field('Background color', colorInput),
        field('Logo SVG', svgInput)
      ]),
      el('div', {className: 'modal_previewWrap'}, [
        el('span', {className: 'modal_label', textContent: 'Preview'}),
        preview
      ])
    ]),
    el('div', {className: 'modal_actions'}, [
      deleteBtn,
      el('div', {className: 'modal_spacer'}),
      cancelBtn,
      saveBtn
    ])
  ])

  const backdrop = el('div', {className: 'modal_backdrop', hidden: true}, [card])

  card.addEventListener('submit', (event) => {
    event.preventDefault()
    onSave({
      name: nameInput.value,
      url: urlInput.value,
      color: colorInput.value,
      svg: svgInput.value
    })
  })
  cancelBtn.addEventListener('click', closeModal)
  deleteBtn.addEventListener('click', onDelete)
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) closeModal()
  })
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !backdrop.hidden) closeModal()
  })

  return {backdrop, title, nameInput, urlInput, colorInput, svgInput, deleteBtn, updatePreview}
}

function openModal(id) {
  editingId = id

  if (id != null) {
    const dial = dials.find((d) => d.id === id)
    if (!dial) return
    modal.title.textContent = 'Edit site'
    modal.nameInput.value = dial.name || ''
    modal.urlInput.value = dial.url || ''
    modal.colorInput.value = toHex(dial.color)
    modal.svgInput.value = dial.svg || ''
    modal.deleteBtn.hidden = false
  } else {
    modal.title.textContent = 'Add a site'
    modal.nameInput.value = ''
    modal.urlInput.value = ''
    modal.colorInput.value = DEFAULT_COLOR
    modal.svgInput.value = ''
    modal.deleteBtn.hidden = true
  }

  modal.updatePreview()
  modal.backdrop.hidden = false
  modal.nameInput.focus()
}

function closeModal() {
  editingId = null
  if (modal) modal.backdrop.hidden = true
}

async function onSave({name, url, color, svg}) {
  const cleanName = (name || '').trim()
  const cleanUrl = normalizeUrl(url)

  if (!cleanName) return modal.nameInput.focus()
  if (!cleanUrl) return modal.urlInput.focus()

  const patch = {name: cleanName, url: cleanUrl, color, svg: (svg || '').trim()}

  if (editingId != null) {
    const dial = dials.find((d) => d.id === editingId)
    if (dial) Object.assign(dial, patch)
  } else {
    dials.push({id: newId(), ...patch})
  }

  await saveDials(dials)
  renderGrid()
  closeModal()
}

async function onDelete() {
  if (editingId == null) return
  dials = dials.filter((d) => d.id !== editingId)
  await saveDials(dials)
  renderGrid()
  closeModal()
}
