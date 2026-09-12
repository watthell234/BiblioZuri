import { useEffect, useRef, useState } from 'react'
import { backend } from '../lib/library'
import { processPhoto, type ProcessedPhoto } from '../lib/image'
import type { Book, Shelf } from '../lib/types'

type Props = {
  shelves: Shelf[]
  defaultShelfId: string | null
  onClose: () => void
  onSaved: (book: Book) => void
  onCreateShelf: (name: string) => Promise<Shelf>
}

const NEW_SHELF = '__new__'

/** Take a photo → see it inside a book → choose the set → it lands on the shelf. */
export default function AddBookSheet({
  shelves,
  defaultShelfId,
  onClose,
  onSaved,
  onCreateShelf,
}: Props) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [photo, setPhoto] = useState<ProcessedPhoto | null>(null)
  const [title, setTitle] = useState('')
  const [shelfId, setShelfId] = useState<string>(defaultShelfId ?? shelves[0]?.id ?? NEW_SHELF)
  const [newShelfName, setNewShelfName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo.previewUrl)
    }
  }, [photo])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(null)
    try {
      const processed = await processPhoto(file)
      setPhoto((previous) => {
        if (previous) URL.revokeObjectURL(previous.previewUrl)
        return processed
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That photo could not be read.')
    }
  }

  async function save() {
    if (!photo || busy) return
    setBusy(true)
    setError(null)
    try {
      let targetShelf = shelfId
      if (targetShelf === NEW_SHELF) {
        const name = newShelfName.trim() || 'New set'
        const shelf = await onCreateShelf(name)
        targetShelf = shelf.id
      }
      const book = await backend.addBook({
        shelfId: targetShelf,
        title: title.trim() || null,
        cover: photo.cover,
        thumb: photo.thumb,
      })
      onSaved(book)
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The book could not be saved.')
      setBusy(false)
    }
  }

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="Add a book">
      <div className="sheet">
        <header className="sheet__head">
          <h2>Add a book</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="sheet__preview">
          <div className={`preview-book ${photo ? 'preview-book--filled' : ''}`}>
            {photo ? (
              <img src={photo.previewUrl} alt="The photo you just took" />
            ) : (
              <span className="preview-book__hint">Your photo goes here</span>
            )}
            <span className="preview-book__spine" aria-hidden="true" />
          </div>
        </div>

        <div className="sheet__actions">
          <button type="button" className="pill pill--primary" onClick={() => cameraRef.current?.click()}>
            📸 Take a photo
          </button>
          <button type="button" className="pill" onClick={() => galleryRef.current?.click()}>
            🖼️ Choose a photo
          </button>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="visually-hidden"
            onChange={handleFile}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="visually-hidden"
            data-testid="photo-input"
            onChange={handleFile}
          />
        </div>

        <label className="field">
          <span>Title (optional)</span>
          <input
            type="text"
            value={title}
            placeholder="The Very Hungry Caterpillar"
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Which set?</span>
          <select value={shelfId} onChange={(event) => setShelfId(event.target.value)}>
            {shelves.map((shelf) => (
              <option key={shelf.id} value={shelf.id}>
                {shelf.name}
              </option>
            ))}
            <option value={NEW_SHELF}>+ new set…</option>
          </select>
        </label>

        {shelfId === NEW_SHELF && (
          <label className="field">
            <span>Name the new set</span>
            <input
              type="text"
              value={newShelfName}
              placeholder="Dr. Seuss"
              onChange={(event) => setNewShelfName(event.target.value)}
            />
          </label>
        )}

        {error && <p className="error">{error}</p>}

        <button
          type="button"
          className="pill pill--save"
          disabled={!photo || busy}
          onClick={save}
        >
          {busy ? 'Placing on the shelf…' : 'Add to library'}
        </button>
      </div>
    </div>
  )
}
