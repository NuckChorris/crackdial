import {useCallback, useEffect, useState} from 'preact/hooks'
import {loadDials, saveDials} from '#/newtab/storage.ts'
import {newId} from '#/newtab/util.ts'
import {Search} from '#/newtab/Search.tsx'
import {SpeedDialGrid} from '#/newtab/SpeedDialGrid.tsx'
import {EditModal} from '#/newtab/EditModal.tsx'
import type {DialDraft, ModalTarget, SpeedDial} from '#/newtab/types.ts'

export function App() {
  const [dials, setDials] = useState<SpeedDial[]>([])
  const [modal, setModal] = useState<ModalTarget | null>(null)

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

  return (
    <main class="page">
      <Search />
      <SpeedDialGrid
        dials={dials}
        onAdd={() => setModal({mode: 'add'})}
        onEdit={(id) => {
          const dial = dials.find((entry) => entry.id === id)
          if (dial) setModal({mode: 'edit', dial})
        }}
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
