import TreeShelf from './TreeShelf'
import { booksOnShelf } from '../lib/library'
import type { Book, Library, Shelf } from '../lib/types'

export type ReadFilter = 'all' | 'unread'

type Props = {
  library: Library
  filter: ReadFilter
  onOpenBook: (book: Book) => void
  onAddHere: (shelf: Shelf) => void
  onRename: (shelf: Shelf) => void
  onAddShelf: () => void
  onShowAll: (shelf: Shelf) => void
}

/** The room itself: sky ceiling, canopy of trees, mossy floor and orange rug. */
export default function LibraryRoom({
  library,
  filter,
  onOpenBook,
  onAddHere,
  onRename,
  onAddShelf,
  onShowAll,
}: Props) {
  return (
    <div className="room">
      <div className="room__ceiling" aria-hidden="true">
        <span className="room__vent" />
        <span className="room__vent room__vent--right" />
      </div>

      <div className="room__scroll">
        <div className="room__trees">
          {library.shelves.map((shelf) => {
            const shelfBooks = booksOnShelf(library, shelf.id)
            const displayBooks =
              filter === 'unread' ? shelfBooks.filter((book) => !book.isRead) : shelfBooks

            return (
              <TreeShelf
                key={shelf.id}
                shelf={shelf}
                books={displayBooks}
                allBooks={shelfBooks}
                onOpenBook={onOpenBook}
                onAddHere={onAddHere}
                onRename={onRename}
                onShowAll={onShowAll}
              />
            )
          })}
          <button type="button" className="tree tree--new" onClick={onAddShelf}>
            <span className="tree--new__icon" aria-hidden="true">🌱</span>
            <span className="tree--new__label">Plant a new set</span>
          </button>
        </div>
      </div>

      <div className="room__floor" aria-hidden="true">
        <span className="pouf pouf--a" />
        <span className="pouf pouf--b" />
        <span className="pouf pouf--c" />
        <span className="room__rug" />
      </div>
    </div>
  )
}
