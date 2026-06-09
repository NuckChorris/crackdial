import {useRef} from 'preact/hooks'
import {DownloadIcon, EditIcon, UploadIcon} from '#/newtab/icons'
import * as styles from './EditControls.module.css'

interface EditControlsProps {
  editMode: boolean
  onToggle: () => void
  onExport: () => void
  onImport: (file: File) => void
}

// Fixed bottom-right cluster: an unobtrusive edit-mode toggle, plus
// import/export buttons that appear to its left while edit mode is on.
export function EditControls({
  editMode,
  onToggle,
  onExport,
  onImport
}: EditControlsProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div class={`${styles.bar}${editMode ? ` ${styles.editing}` : ''}`}>
      {editMode && (
        <>
          <button
            type="button"
            class={styles.btn}
            title="Import sites…"
            aria-label="Import sites from a file"
            onClick={() => fileRef.current?.click()}
          >
            <UploadIcon />
          </button>
          <button
            type="button"
            class={styles.btn}
            title="Export sites…"
            aria-label="Export sites to a file"
            onClick={onExport}
          >
            <DownloadIcon />
          </button>
        </>
      )}

      <button
        type="button"
        class={`${styles.btn}${editMode ? ` ${styles.btnOn}` : ''}`}
        title={editMode ? 'Done editing' : 'Edit sites'}
        aria-label={editMode ? 'Done editing' : 'Edit sites'}
        aria-pressed={editMode}
        onClick={onToggle}
      >
        <EditIcon />
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        class={styles.file}
        onChange={(event) => {
          const input = event.currentTarget as HTMLInputElement
          const file = input.files?.[0]
          input.value = '' // allow re-selecting the same file
          if (file) onImport(file)
        }}
      />
    </div>
  )
}
