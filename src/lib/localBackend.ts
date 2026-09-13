import type { Backend, Book, Library, Shelf } from './types'
import { pickAccent, pickSpineColor } from './palette'

/**
 * Fallback used when the site is built without Supabase credentials: the whole
 * library lives in this browser. Metadata in localStorage, photos in IndexedDB
 * (localStorage is far too small for images).
 */

const META_KEY = 'bibliozuri.library.v1'
const DB_NAME = 'bibliozuri'
const STORE = 'photos'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function putBlob(path: string, blob: Blob): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(blob, path)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

async function getBlob(path: string): Promise<Blob | undefined> {
  const db = await openDb()
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const request = tx.objectStore(STORE).get(path)
    request.onsuccess = () => resolve(request.result as Blob | undefined)
    request.onerror = () => reject(request.error)
  })
  db.close()
  return blob
}

async function deleteBlobs(paths: string[]): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    for (const path of paths) tx.objectStore(STORE).delete(path)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

function readMeta(): Library {
  try {
    const raw = localStorage.getItem(META_KEY)
    if (!raw) return { shelves: [], books: [] }
    const parsed = JSON.parse(raw) as Library
    return {
      shelves: parsed.shelves ?? [],
      // Books stored before title extraction existed have neither field.
      books: (parsed.books ?? []).map((book) => ({
        ...book,
        extractedTitle: book.extractedTitle ?? null,
        titleStatus: book.titleStatus ?? 'skipped',
      })),
    }
  } catch {
    return { shelves: [], books: [] }
  }
}

function writeMeta(library: Library): void {
  localStorage.setItem(META_KEY, JSON.stringify(library))
}

const urlCache = new Map<string, string>()

export const localBackend: Backend = {
  label: 'this device',

  async load() {
    return readMeta()
  },

  async addShelf(name) {
    const library = readMeta()
    const shelf: Shelf = {
      id: crypto.randomUUID(),
      name,
      accent: pickAccent(library.shelves.length),
      position: library.shelves.length,
    }
    library.shelves.push(shelf)
    writeMeta(library)
    return shelf
  },

  async renameShelf(id, name) {
    const library = readMeta()
    const shelf = library.shelves.find((item) => item.id === id)
    if (shelf) shelf.name = name
    writeMeta(library)
  },

  async addBook({ shelfId, title, cover, thumb }) {
    const library = readMeta()
    const id = crypto.randomUUID()
    const coverPath = `${id}/cover.jpg`
    const thumbPath = `${id}/thumb.jpg`
    await putBlob(coverPath, cover)
    await putBlob(thumbPath, thumb)
    const book: Book = {
      id,
      shelfId,
      title,
      coverPath,
      thumbPath,
      spineColor: pickSpineColor(library.books.length),
      isRead: false,
      readAt: null,
      position: library.books.filter((item) => item.shelfId === shelfId).length,
      extractedTitle: null,
      // Reading a cover needs the edge function, which only the cloud library has.
      titleStatus: 'skipped',
    }
    library.books.push(book)
    writeMeta(library)
    return book
  },

  async setRead(id, isRead) {
    const library = readMeta()
    const book = library.books.find((item) => item.id === id)
    if (!book) throw new Error('That book is no longer in the library.')
    book.isRead = isRead
    book.readAt = isRead ? new Date().toISOString() : null
    writeMeta(library)
    return book
  },

  async deleteBook(id) {
    const library = readMeta()
    const book = library.books.find((item) => item.id === id)
    library.books = library.books.filter((item) => item.id !== id)
    writeMeta(library)
    if (book) await deleteBlobs([book.coverPath, book.thumbPath])
  },

  async extractTitle() {
    // No edge function to call — this library only ever searches typed titles.
    return null
  },

  async urlFor(path) {
    const cached = urlCache.get(path)
    if (cached) return cached
    const blob = await getBlob(path)
    if (!blob) return ''
    const url = URL.createObjectURL(blob)
    urlCache.set(path, url)
    return url
  },
}
