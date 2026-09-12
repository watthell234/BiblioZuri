import { useEffect, useState } from 'react'
import { backend } from '../lib/library'
import { usePhotoUrl } from '../lib/useObjectUrl'
import type { Book } from '../lib/types'

type Props = {
  book: Book
  shelfName: string
  onClose: () => void
  onChanged: (book: Book) => void
  onDeleted: (id: string) => void
  onCelebrate: () => void
}

/** The book opens: your photo on the right page, the read button on the left. */
export default function BookDetail({
  book,
  shelfName,
  onClose,
  onChanged,
  onDeleted,
  onCelebrate,
}: Props) {
  const cover = usePhotoUrl(book.coverPath)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function toggleRead() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const updated = await backend.setRead(book.id, !book.isRead)
      onChanged(updated)
      if (updated.isRead) onCelebrate()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That change could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (busy) return
    setBusy(true)
    try {
      await backend.deleteBook(book.id)
      onDeleted(book.id)
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That book could not be removed.')
      setBusy(false)
    }
  }

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="Book">
      <div className="open-book">
        <div className="open-book__page open-book__page--left">
          <p className="open-book__set">{shelfName}</p>
          <h2 className="open-book__title">{book.title?.trim() || 'This book'}</h2>
          <p className={`open-book__status ${book.isRead ? 'is-read' : ''}`}>
            {book.isRead
              ? `Read${book.readAt ? ` on ${new Date(book.readAt).toLocaleDateString()}` : ''} 🌟`
              : 'Not read yet'}
          </p>

          <button
            type="button"
            className={`pill pill--read ${book.isRead ? 'pill--undo' : ''}`}
            onClick={toggleRead}
            disabled={busy}
          >
            {book.isRead ? 'Mark as not read' : 'I read it!'}
          </button>

          {error && <p className="error">{error}</p>}

          <div className="open-book__footer">
            {confirmDelete ? (
              <span className="confirm">
                Remove this book?
                <button type="button" className="link link--danger" onClick={remove}>
                  yes, remove
                </button>
                <button type="button" className="link" onClick={() => setConfirmDelete(false)}>
                  keep it
                </button>
              </span>
            ) : (
              <button type="button" className="link" onClick={() => setConfirmDelete(true)}>
                Remove from library
              </button>
            )}
          </div>
        </div>

        <div className="open-book__page open-book__page--right">
          {cover ? (
            <img className="open-book__photo" src={cover} alt={book.title ?? 'Book cover photo'} />
          ) : (
            <div className="open-book__photo open-book__photo--loading" />
          )}
        </div>

        <button type="button" className="icon-button open-book__close" onClick={onClose} aria-label="Close the book">
          ✕
        </button>
      </div>
    </div>
  )
}
