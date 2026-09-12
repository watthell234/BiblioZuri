export type Shelf = {
  id: string
  name: string
  accent: string
  position: number
}

export type Book = {
  id: string
  shelfId: string
  title: string | null
  coverPath: string
  thumbPath: string
  spineColor: string
  isRead: boolean
  readAt: string | null
  position: number
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
  /** Resolves a stored path to something an <img src> can use. */
  urlFor(path: string): Promise<string>
}
