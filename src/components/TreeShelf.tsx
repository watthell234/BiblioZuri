import BookSpine from './BookSpine'
import ShelfProgress from './ShelfProgress'
import type { Book, Shelf } from '../lib/types'

type Props = {
  shelf: Shelf
  books: Book[]
  onOpenBook: (book: Book) => void
  onAddHere: (shelf: Shelf) => void
  onRename: (shelf: Shelf) => void
}

const BOOKS_PER_ROW = 3
const MIN_ROWS = 3

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
export default function TreeShelf({ shelf, books, onOpenBook, onAddHere, onRename }: Props) {
  const rows = chunk(books)
  const read = books.filter((book) => book.isRead).length
  const firstEmptyRow = rows.findIndex((row) => row.length === 0)

  return (
    <section className="tree" style={{ ['--accent' as string]: shelf.accent }}>
      <ShelfProgress read={read} total={books.length} accent={shelf.accent} />

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
                  {row.length === 0 && index === firstEmptyRow && (
                    <button
                      type="button"
                      className="ghost-book"
                      onClick={() => onAddHere(shelf)}
                      aria-label={`Add a book to ${shelf.name}`}
                    >
                      <span aria-hidden="true">+</span>
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
