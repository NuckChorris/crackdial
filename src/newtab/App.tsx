import {useCallback, useEffect, useState} from 'preact/hooks'
import {dialsFromJson, dialsToJson, loadDials, saveDials} from '#/newtab/storage'
import {arrayMove, newId} from '#/newtab/util'
import {Search} from '#/newtab/Search'
import {Weather} from '#/newtab/Weather'
import {SpeedDialGrid} from '#/newtab/SpeedDialGrid'
import {EditControls} from '#/newtab/EditControls'
import {EditModal} from '#/newtab/EditModal'
import type {DialDraft, ModalTarget, SpeedDial} from '#/newtab/types'

export function App() {
  const [dials, setDials] = useState<SpeedDial[]>([])
  const [modal, setModal] = useState<ModalTarget | null>(null)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    loadDials().then(setDials)
  }, [])

  const handleSave = useCallback((data: DialDraft, id: string | null) => {
    setDials((prev) => {
      const next = id
        ? prev.map((dial) => (dial.id === id ? {...dial, ...data} : dial))
        : [...prev, {id: newId(), ...data}]
      saveDials(next)
      return next
    })
    setModal(null)
  }, [])

  const handleDelete = useCallback((id: string) => {
    setDials((prev) => {
      const next = prev.filter((dial) => dial.id !== id)
      saveDials(next)
      return next
    })
    setModal(null)
  }, [])

  const handleExport = () => {
    const blob = new Blob([dialsToJson(dials)], {type: 'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'launchpad-sites.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleReorder = useCallback((from: number, to: number) => {
    setDials((prev) => {
      const next = arrayMove(prev, from, to)
      saveDials(next)
      return next
    })
  }, [])

  const handleImport = useCallback(async (file: File) => {
    let text: string
    try {
      text = await file.text()
    } catch {
      window.alert('Couldn’t read that file.')
      return
    }
    const imported = dialsFromJson(text)
    if (!imported) {
      window.alert('That doesn’t look like a valid sites export.')
      return
    }
    setDials(imported)
    saveDials(imported)
  }, [])

  return (
    <main class="page">
      <Weather />
      <Search />
      <SpeedDialGrid
        dials={dials}
        editMode={editMode}
        onAdd={() => setModal({mode: 'add'})}
        onEdit={(id) => {
          const dial = dials.find((entry) => entry.id === id)
          if (dial) setModal({mode: 'edit', dial})
        }}
        onReorder={handleReorder}
      />
      <EditControls
        editMode={editMode}
        onToggle={() => setEditMode((on) => !on)}
        onExport={handleExport}
        onImport={handleImport}
      />
      {modal && (
        <EditModal
          target={modal}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModal(null)}
        />
      )}
    </main>
  )
}
