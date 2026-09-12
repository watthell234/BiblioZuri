import { useCallback, useEffect, useState } from 'react'
import { backend, loadLibrary } from './library'
import type { Book, Library } from './types'

type State = {
  library: Library
  status: 'loading' | 'ready' | 'error'
  error: string | null
}

export function useLibrary() {
  const [state, setState] = useState<State>({
    library: { shelves: [], books: [] },
    status: 'loading',
    error: null,
  })

  const refresh = useCallback(async () => {
    try {
      const library = await loadLibrary()
      setState({ library, status: 'ready', error: null })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Something went wrong.',
      }))
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const upsertBook = useCallback((book: Book) => {
    setState((prev) => {
      const exists = prev.library.books.some((item) => item.id === book.id)
      const books = exists
        ? prev.library.books.map((item) => (item.id === book.id ? book : item))
        : [...prev.library.books, book]
      return { ...prev, library: { ...prev.library, books } }
    })
  }, [])

  const removeBook = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      library: { ...prev.library, books: prev.library.books.filter((item) => item.id !== id) },
    }))
  }, [])

  const addShelf = useCallback(async (name: string) => {
    const shelf = await backend.addShelf(name)
    setState((prev) => ({
      ...prev,
      library: { ...prev.library, shelves: [...prev.library.shelves, shelf] },
    }))
    return shelf
  }, [])

  const renameShelf = useCallback(async (id: string, name: string) => {
    await backend.renameShelf(id, name)
    setState((prev) => ({
      ...prev,
      library: {
        ...prev.library,
        shelves: prev.library.shelves.map((shelf) =>
          shelf.id === id ? { ...shelf, name } : shelf,
        ),
      },
    }))
  }, [])

  return { ...state, refresh, upsertBook, removeBook, addShelf, renameShelf }
}
