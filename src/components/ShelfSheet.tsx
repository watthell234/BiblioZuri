import { useEffect, useMemo, useState } from 'react'
import { usePhotoUrl } from '../lib/useObjectUrl'
import type { Book, Shelf } from '../lib/types'

type Props = {
  shelf: Shelf
  books: Book[]
  onOpenBook: (book: Book) => void
  onClose: () => void
}

type ReadFilter = 'all' | 'unread' | 'read'

/** One cover tile in the index grid — flat, no tree-style lean or height. */
function ShelfSheetItem({ book, onOpen }: { book: Book; onOpen: (book: Book) => void }) {
  const thumb = usePhotoUrl(book.thumbPath)
  const label = book.title?.trim() || 'Untitled book'

  return (
    <button
      type="button"
      className="shelf-sheet__item"
      onClick={() => onOpen(book)}
      aria-label={`${label}. ${book.isRead ? 'Read' : 'Not read yet'}. Open it.`}
    >
      <span className="shelf-sheet__thumb">
        {thumb ? (
          <img src={thumb} alt="" loading="lazy" />
        ) : (
          <span className="shelf-sheet__thumb--empty" />
        )}
        {book.isRead && <span className="shelf-sheet__leaf" aria-hidden="true">🌟</span>}
      </span>
      <span className="shelf-sheet__title">{label}</span>
    </button>
  )
}

/**
 * The full index of one shelf: every book, searchable by title and
 * filterable by read state — the honest "browse everything" surface for
 * shelves too full to show on the tree itself.
 */
export default function ShelfSheet({ shelf, books, onOpenBook, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ReadFilter>('all')

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return books.filter((book) => {
      if (filter === 'unread' && book.isRead) return false
      if (filter === 'read' && !book.isRead) return false
      if (needle && !(book.title ?? '').toLowerCase().includes(needle)) return false
      return true
    })
  }, [books, query, filter])

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label={`${shelf.name} books`}>
      <div className="sheet shelf-sheet">
        <header className="sheet__head">
          <h2>{shelf.name}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <label className="field shelf-sheet__search">
          <span>Search by title</span>
          <input
            type="text"
            value={query}
            placeholder="Search this shelf…"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="shelf-sheet__filters" role="group" aria-label="Filter by read state">
          {(['all', 'unread', 'read'] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={`chip ${filter === option ? 'chip--active' : ''}`}
              aria-pressed={filter === option}
              onClick={() => setFilter(option)}
            >
              {option === 'all' ? 'All' : option === 'unread' ? 'Unread' : 'Read'}
            </button>
          ))}
        </div>

        {results.length > 0 ? (
          <div className="shelf-sheet__grid">
            {results.map((book) => (
              <ShelfSheetItem key={book.id} book={book} onOpen={onOpenBook} />
            ))}
          </div>
        ) : (
          <p className="shelf-sheet__empty">No books match here.</p>
        )}
      </div>
    </div>
  )
}
