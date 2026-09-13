import BookSpine from './BookSpine'
import ShelfProgress from './ShelfProgress'
import type { Book, Shelf } from '../lib/types'

type Props = {
  shelf: Shelf
  /** The books to draw on the tree — already filtered by the room's read/unread toggle. */
  books: Book[]
  /** Every book on this shelf, filter aside — feeds the lamp count and the "browse all" sheet. */
  allBooks: Book[]
  onOpenBook: (book: Book) => void
  onAddHere: (shelf: Shelf) => void
  onRename: (shelf: Shelf) => void
  onShowAll: (shelf: Shelf) => void
}

const BOOKS_PER_ROW = 3
const MIN_ROWS = 3
const VISIBLE_ROWS = 4
const CAP = VISIBLE_ROWS * BOOKS_PER_ROW

function chunk(books: Book[]): Book[][] {
  const rows: Book[][] = []
  for (let i = 0; i < books.length; i += BOOKS_PER_ROW) {
    rows.push(books.slice(i, i + BOOKS_PER_ROW))
  }
  while (rows.length < MIN_ROWS) rows.push([])
  return rows
}

/**
 * One set of books growing on its own tree: an organic wooden bookcase that
 * flares out at the canopy and tapers toward the floor, with a dark green
 * recess behind the shelves.
 */
export default function TreeShelf({
  shelf,
  books,
  allBooks,
  onOpenBook,
  onAddHere,
  onRename,
  onShowAll,
}: Props) {
  const overflow = books.length > CAP
  const visibleBooks = overflow ? books.slice(0, CAP - 1) : books
  const remaining = overflow ? books.length - visibleBooks.length : 0
  const rows = chunk(visibleBooks)
  const firstEmptyRow = rows.findIndex((row) => row.length === 0)
  const read = allBooks.filter((book) => book.isRead).length

  // The shelf really is empty vs. every book on it just being filtered out
  // (e.g. "unread only" with nothing left to read here) — those need
  // different messages in the first empty row.
  const filteredEmpty = allBooks.length > 0 && books.length === 0

  return (
    <section className="tree" style={{ ['--accent' as string]: shelf.accent }}>
      <ShelfProgress read={read} total={allBooks.length} accent={shelf.accent} />

      <div className="tree__frame">
        <div className="tree__cavity">
          {/* Wavy wooden ribs running down the back of the case. */}
          <svg className="tree__ribs" viewBox="0 0 240 520" preserveAspectRatio="none" aria-hidden="true">
            <path d="M40 0 C 18 130, 30 250, 46 360 C 58 440, 56 480, 50 520" />
            <path d="M120 0 C 108 140, 118 260, 124 370 C 128 450, 126 486, 122 520" />
            <path d="M200 0 C 222 130, 210 250, 194 360 C 182 440, 184 480, 190 520" />
          </svg>

          <div className="tree__rows">
            {rows.map((row, index) => (
              <div className="plank" key={index}>
                <div className="plank__books">
                  {row.map((book) => (
                    <BookSpine key={book.id} book={book} onOpen={onOpenBook} />
                  ))}
                  {row.length === 0 && index === firstEmptyRow && filteredEmpty && (
                    <span className="plank__empty">All caught up here 🌟</span>
                  )}
                  {row.length === 0 && index === firstEmptyRow && !filteredEmpty && (
                    <button
                      type="button"
                      className="ghost-book"
                      onClick={() => onAddHere(shelf)}
                      aria-label={`Add a book to ${shelf.name}`}
                    >
                      <span aria-hidden="true">+</span>
                    </button>
                  )}
                  {overflow && index === rows.length - 1 && (
                    <button
                      type="button"
                      className="more-tile"
                      onClick={() => onShowAll(shelf)}
                      aria-label={`Show ${remaining} more books on ${shelf.name}`}
                    >
                      +{remaining}
                    </button>
                  )}
                </div>
                <div className="plank__board" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <button type="button" className="tree__name" onClick={() => onRename(shelf)}>
        {shelf.name}
        <span className="tree__name-hint" aria-hidden="true">rename</span>
      </button>
    </section>
  )
}
