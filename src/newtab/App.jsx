import {useCallback, useEffect, useState} from 'preact/hooks'
import {loadDials, saveDials} from './storage.js'
import {newId} from './util.js'
import {Search} from './Search.jsx'
import {SpeedDialGrid} from './SpeedDialGrid.jsx'
import {EditModal} from './EditModal.jsx'

export function App() {
  const [dials, setDials] = useState([])
  // null = closed, {mode: 'add'} = adding, {mode: 'edit', dial} = editing.
  const [modal, setModal] = useState(null)

  useEffect(() => {
    loadDials().then(setDials)
  }, [])

  const handleSave = useCallback((data, id) => {
    setDials((prev) => {
      const next = id
        ? prev.map((dial) => (dial.id === id ? {...dial, ...data} : dial))
        : [...prev, {id: newId(), ...data}]
      saveDials(next)
      return next
    })
    setModal(null)
  }, [])

  const handleDelete = useCallback((id) => {
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
        onEdit={(id) =>
          setModal({mode: 'edit', dial: dials.find((dial) => dial.id === id)})
        }
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
