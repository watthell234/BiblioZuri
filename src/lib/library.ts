import { hasSupabase } from './supabase'
import { supabaseBackend } from './supabaseBackend'
import { localBackend } from './localBackend'
import type { Backend, Library } from './types'

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
