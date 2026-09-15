import BookSpine from './BookSpine'
import type { Book, Shelf } from '../lib/types'

type Props = {
  books: Book[]
  shelves: Shelf[]
  query: string
  onOpenBook: (book: Book) => void
}

/**
 * What a search turns up: the matching books lifted off their trees and stood
 * in a row, each still labelled with the set it came from.
 */
export default function SearchResults({ books, shelves, query, onOpenBook }: Props) {
  if (books.length === 0) {
    return (
      <p className="notice">
        No books match “{query}”. Titles are read from the photos in the background, so a
        book added moments ago may not be findable yet.
      </p>
    )
  }

  const shelfName = (id: string) =>
    shelves.find((shelf) => shelf.id === id)?.name ?? 'Library'

  return (
    <section className="results" aria-label={`Books matching ${query}`}>
      <p className="results__count">
        {books.length === 1 ? '1 book' : `${books.length} books`} found
      </p>
      <ul className="results__grid">
        {books.map((book) => (
          <li key={book.id} className="results__item">
            <BookSpine book={book} onOpen={onOpenBook} />
            <span className="results__shelf">{shelfName(book.shelfId)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
