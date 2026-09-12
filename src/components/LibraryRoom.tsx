import TreeShelf from './TreeShelf'
import { booksOnShelf } from '../lib/library'
import type { Book, Library, Shelf } from '../lib/types'

type Props = {
  library: Library
  onOpenBook: (book: Book) => void
  onAddHere: (shelf: Shelf) => void
  onRename: (shelf: Shelf) => void
  onAddShelf: () => void
}

/** The room itself: sky ceiling, canopy of trees, mossy floor and orange rug. */
export default function LibraryRoom({
  library,
  onOpenBook,
  onAddHere,
  onRename,
  onAddShelf,
}: Props) {
  return (
    <div className="room">
      <div className="room__ceiling" aria-hidden="true">
        <span className="room__vent" />
        <span className="room__vent room__vent--right" />
      </div>

      <div className="room__scroll">
        <div className="room__trees">
          {library.shelves.map((shelf) => (
            <TreeShelf
              key={shelf.id}
              shelf={shelf}
              books={booksOnShelf(library, shelf.id)}
              onOpenBook={onOpenBook}
              onAddHere={onAddHere}
              onRename={onRename}
            />
          ))}
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
