import { usePhotoUrl } from '../lib/useObjectUrl'
import type { Book } from '../lib/types'

type Props = {
  book: Book
  onOpen: (book: Book) => void
}

/**
 * A book standing on a shelf: a coloured spine turned slightly toward the reader
 * with the photographed cover on its face. Unread books rest in shadow; read
 * books are bright and wear a gold leaf.
 */
export default function BookSpine({ book, onOpen }: Props) {
  const thumb = usePhotoUrl(book.thumbPath)
  const label = book.title?.trim() || 'Untitled book'
  // A little variation in height and lean so a shelf never looks machine-stacked.
  const seed = book.id.charCodeAt(0) + book.id.charCodeAt(book.id.length - 1)
  const height = 78 + (seed % 5) * 4
  const lean = (seed % 3) - 1

  return (
    <button
      type="button"
      className={`book ${book.isRead ? 'book--read' : 'book--unread'}`}
      style={{
        ['--spine' as string]: book.spineColor,
        ['--book-h' as string]: `${height}px`,
        ['--lean' as string]: `${lean}deg`,
      }}
      onClick={() => onOpen(book)}
      aria-label={`${label}. ${book.isRead ? 'Read' : 'Not read yet'}. Open it.`}
    >
      <span className="book__spine" aria-hidden="true" />
      <span className="book__face">
        {thumb ? (
          <img className="book__photo" src={thumb} alt="" loading="lazy" />
        ) : (
          <span className="book__photo book__photo--empty" />
        )}
        <span className="book__sheen" aria-hidden="true" />
        {book.title && <span className="book__title">{book.title}</span>}
      </span>
      {book.isRead && (
        <span className="book__leaf" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="15" height="15">
            <path d="M20.5 3.5C21 11 16.5 16 10.5 16c-1.6 0-3-.4-4-1 1-6.5 6-11 14-11.5Z" fill="#f6c945" />
            <path d="M18 6C13 8.5 9.6 12 7.5 17.5" stroke="#8a6a12" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          </svg>
        </span>
      )}
    </button>
  )
}
