import { hasSupabase } from './supabase'
import { supabaseBackend } from './supabaseBackend'
import { localBackend } from './localBackend'
import type { Backend, Book, Library } from './types'

/**
 * The single seam between the UI and wherever the library is stored.
 * Adding a passcode or a real login later means changing this file only.
 */
export const backend: Backend = hasSupabase ? supabaseBackend : localBackend

export const isCloud = hasSupabase

/** The shelves a brand-new library starts with, so the room is never empty. */
const STARTER_SHELVES = ['Bedtime Stories', 'Picture Books', 'Big Kid Books']

export async function loadLibrary(): Promise<Library> {
  const library = await backend.load()
  if (library.shelves.length > 0) return library
  const shelves = []
  for (const name of STARTER_SHELVES) {
    shelves.push(await backend.addShelf(name))
  }
  return { shelves, books: library.books }
}

export function booksOnShelf(library: Library, shelfId: string) {
  return library.books
    .filter((book) => book.shelfId === shelfId)
    .sort((a, b) => a.position - b.position)
}

export function shelfProgress(library: Library, shelfId: string) {
  const books = booksOnShelf(library, shelfId)
  const read = books.filter((book) => book.isRead).length
  return { read, total: books.length }
}

/**
 * Fold a title down to something two people typing loosely will still match on:
 * no case, no accents, no punctuation, single spaces.
 *
 * Apostrophes are dropped rather than spaced out, so that a cover reading
 * "Gruffalo's Child" is still found by someone typing "gruffalos child".
 */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['\u2018\u2019]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Books whose title matches the query — the one a parent typed, or the one read
 * off the cover photo in the background. The extracted title is only ever
 * matched against; it is never shown.
 */
export function searchBooks(library: Library, query: string): Book[] {
  const needle = normalize(query)
  if (!needle) return []
  return library.books.filter((book) =>
    [book.title, book.extractedTitle].some(
      (title) => title && normalize(title).includes(needle),
    ),
  )
}
