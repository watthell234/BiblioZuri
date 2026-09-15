import { useCallback, useMemo, useState } from 'react'
import LibraryRoom, { type ReadFilter } from './components/LibraryRoom'
import AddBookSheet from './components/AddBookSheet'
import BookDetail from './components/BookDetail'
import ShelfSheet from './components/ShelfSheet'
import Celebration from './components/Celebration'
import SearchResults from './components/SearchResults'
import { useLibrary } from './lib/useLibrary'
import { backend, booksOnShelf, isCloud, searchBooks } from './lib/library'
import type { Book, Shelf } from './lib/types'

export default function App() {
  const { library, status, error, upsertBook, removeBook, addShelf, renameShelf } = useLibrary()
  const [adding, setAdding] = useState<{ shelfId: string | null } | null>(null)
  const [openBook, setOpenBook] = useState<Book | null>(null)
  const [browsingShelf, setBrowsingShelf] = useState<Shelf | null>(null)
  const [filter, setFilter] = useState<ReadFilter>('all')
  const [celebration, setCelebration] = useState(0)
  const [query, setQuery] = useState('')

  const searching = query.trim().length > 0
  const matches = useMemo(
    () => (searching ? searchBooks(library, query) : []),
    [library, query, searching],
  )

  const totals = useMemo(() => {
    const read = library.books.filter((book) => book.isRead).length
    return { read, total: library.books.length }
  }, [library.books])

  const handleAddShelf = useCallback(async () => {
    const name = window.prompt('Name this set of books', 'New set')
    if (name && name.trim()) await addShelf(name.trim())
  }, [addShelf])

  const handleRename = useCallback(
    async (shelf: Shelf) => {
      const name = window.prompt('Rename this set', shelf.name)
      if (name && name.trim() && name.trim() !== shelf.name) {
        await renameShelf(shelf.id, name.trim())
      }
    },
    [renameShelf],
  )

  const openShelfName =
    library.shelves.find((shelf) => shelf.id === openBook?.shelfId)?.name ?? 'Library'

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1 className="topbar__title">Zuri&apos;s Library</h1>
          <p className="topbar__sub">
            {totals.total === 0
              ? 'Take a picture of a book to begin'
              : `${totals.read} of ${totals.total} books read`}
          </p>
          {totals.total > 0 && (
            <button
              type="button"
              className={`chip topbar__filter ${filter === 'unread' ? 'chip--active' : ''}`}
              aria-pressed={filter === 'unread'}
              onClick={() => setFilter((current) => (current === 'unread' ? 'all' : 'unread'))}
            >
              Unread only
            </button>
          )}
        </div>
        <div className="topbar__tools">
          <input
            type="search"
            className="topbar__search"
            value={query}
            placeholder="Search books"
            aria-label="Search books by title"
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type="button"
            className="pill pill--primary topbar__add"
            onClick={() => setAdding({ shelfId: null })}
          >
            📸 Add a book
          </button>
        </div>
      </header>

      {status === 'loading' && <p className="notice">Opening the library…</p>}
      {status === 'error' && (
        <p className="notice notice--error">
          {error} {isCloud ? 'Check the connection and reload.' : ''}
        </p>
      )}

      {status === 'ready' && searching && (
        <SearchResults
          books={matches}
          shelves={library.shelves}
          query={query.trim()}
          onOpenBook={setOpenBook}
        />
      )}

      {status === 'ready' && !searching && (
        <LibraryRoom
          library={library}
          filter={filter}
          onOpenBook={setOpenBook}
          onAddHere={(shelf) => setAdding({ shelfId: shelf.id })}
          onRename={handleRename}
          onAddShelf={handleAddShelf}
          onShowAll={setBrowsingShelf}
        />
      )}

      <button
        type="button"
        className="fab"
        onClick={() => setAdding({ shelfId: null })}
        aria-label="Add a book"
      >
        +
      </button>

      <p className="footnote">Saved to {backend.label}.</p>

      {adding && (
        <AddBookSheet
          shelves={library.shelves}
          defaultShelfId={adding.shelfId}
          onClose={() => setAdding(null)}
          onSaved={upsertBook}
          onCreateShelf={addShelf}
        />
      )}

      {openBook && (
        <BookDetail
          book={library.books.find((book) => book.id === openBook.id) ?? openBook}
          shelfName={openShelfName}
          onClose={() => setOpenBook(null)}
          onChanged={(book) => {
            upsertBook(book)
            setOpenBook(book)
          }}
          onDeleted={removeBook}
          onCelebrate={() => setCelebration((value) => value + 1)}
        />
      )}

      {browsingShelf && (
        <ShelfSheet
          shelf={browsingShelf}
          books={booksOnShelf(library, browsingShelf.id)}
          onOpenBook={(book) => {
            setBrowsingShelf(null)
            setOpenBook(book)
          }}
          onClose={() => setBrowsingShelf(null)}
        />
      )}

      <Celebration token={celebration} />
    </div>
  )
}
