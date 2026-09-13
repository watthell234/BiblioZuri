import { backend, isCloud } from './library'
import type { Book } from './types'

/**
 * Reading a cover photo happens in the background, never while a book is being
 * added — saving a book stays as quick as it ever was. Every book starts out
 * 'pending' (including all the books that existed before this feature), and the
 * app drains that queue whenever it opens.
 */

/** How many covers to read at once. Gentle on a phone and on the API. */
const CONCURRENCY = 2

/** Books being read right now, so a re-render can't queue the same one twice. */
const inFlight = new Set<string>()

async function extractOne(id: string, onBookUpdated: (book: Book) => void) {
  try {
    const book = await backend.extractTitle(id)
    if (book) onBookUpdated(book)
  } catch {
    // A cover that can't be read is not something to bother anyone with: the
    // book keeps working, it just isn't searchable by its printed title. The
    // row is left 'failed' and tried again next time the app opens.
  } finally {
    inFlight.delete(id)
  }
}

/**
 * Kick off title extraction for every book still waiting for one.
 * Returns immediately — callers are not meant to await this.
 */
export function drainTitleQueue(books: Book[], onBookUpdated: (book: Book) => void): void {
  if (!isCloud) return

  const queue = books
    .filter((book) => book.titleStatus === 'pending' && !inFlight.has(book.id))
    .map((book) => book.id)
  if (queue.length === 0) return

  for (const id of queue) inFlight.add(id)

  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    for (let id = queue.shift(); id; id = queue.shift()) {
      await extractOne(id, onBookUpdated)
    }
  })
  void Promise.all(workers)
}
