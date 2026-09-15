export type Shelf = {
  id: string
  name: string
  accent: string
  position: number
}

/**
 * How far along the background read of a book's cover photo is.
 * 'done' does not promise a title — some covers have nothing legible.
 */
export type TitleStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped'

export type Book = {
  id: string
  shelfId: string
  /** What a parent typed in, if they typed anything. */
  title: string | null
  coverPath: string
  thumbPath: string
  spineColor: string
  isRead: boolean
  readAt: string | null
  position: number
  /** Read off the cover photo in the background. Searched, never displayed. */
  extractedTitle: string | null
  titleStatus: TitleStatus
}

export type Library = {
  shelves: Shelf[]
  books: Book[]
}

/** Every data operation the UI is allowed to perform. One seam, two implementations. */
export type Backend = {
  /** Human-readable name of where the data lives, shown in the UI footer. */
  label: string
  load(): Promise<Library>
  addShelf(name: string): Promise<Shelf>
  renameShelf(id: string, name: string): Promise<void>
  addBook(input: {
    shelfId: string
    title: string | null
    cover: Blob
    thumb: Blob
  }): Promise<Book>
  setRead(id: string, isRead: boolean): Promise<Book>
  deleteBook(id: string): Promise<void>
  /**
   * Read this book's title off its cover photo and store it for search.
   * Returns the updated book, or null where extraction isn't available.
   */
  extractTitle(id: string): Promise<Book | null>
  /** Resolves a stored path to something an <img src> can use. */
  urlFor(path: string): Promise<string>
}
