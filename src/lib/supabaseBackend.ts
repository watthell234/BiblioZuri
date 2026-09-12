import { COVERS_BUCKET, supabase } from './supabase'
import { pickAccent, pickSpineColor } from './palette'
import type { Backend, Book, Shelf } from './types'

type ShelfRow = { id: string; name: string; accent: string; position: number }
type BookRow = {
  id: string
  shelf_id: string
  title: string | null
  cover_path: string
  thumb_path: string
  spine_color: string
  is_read: boolean
  read_at: string | null
  position: number
}

const toShelf = (row: ShelfRow): Shelf => ({
  id: row.id,
  name: row.name,
  accent: row.accent,
  position: row.position,
})

const toBook = (row: BookRow): Book => ({
  id: row.id,
  shelfId: row.shelf_id,
  title: row.title,
  coverPath: row.cover_path,
  thumbPath: row.thumb_path,
  spineColor: row.spine_color,
  isRead: row.is_read,
  readAt: row.read_at,
  position: row.position,
})

function client() {
  if (!supabase) throw new Error('The library is not connected to its database.')
  return supabase
}

export const supabaseBackend: Backend = {
  label: 'the family library',

  async load() {
    const db = client()
    const [shelves, books] = await Promise.all([
      db.from('shelves').select('*').order('position'),
      db.from('books').select('*').order('position'),
    ])
    if (shelves.error) throw shelves.error
    if (books.error) throw books.error
    return {
      shelves: (shelves.data as ShelfRow[]).map(toShelf),
      books: (books.data as BookRow[]).map(toBook),
    }
  },

  async addShelf(name) {
    const db = client()
    const { count } = await db.from('shelves').select('id', { count: 'exact', head: true })
    const position = count ?? 0
    const { data, error } = await db
      .from('shelves')
      .insert({ name, accent: pickAccent(position), position })
      .select()
      .single()
    if (error) throw error
    return toShelf(data as ShelfRow)
  },

  async renameShelf(id, name) {
    const { error } = await client().from('shelves').update({ name }).eq('id', id)
    if (error) throw error
  },

  async addBook({ shelfId, title, cover, thumb }) {
    const db = client()
    const id = crypto.randomUUID()
    const coverPath = `${id}/cover.jpg`
    const thumbPath = `${id}/thumb.jpg`

    const uploads = await Promise.all([
      db.storage.from(COVERS_BUCKET).upload(coverPath, cover, { contentType: 'image/jpeg' }),
      db.storage.from(COVERS_BUCKET).upload(thumbPath, thumb, { contentType: 'image/jpeg' }),
    ])
    for (const upload of uploads) if (upload.error) throw upload.error

    const { count } = await db
      .from('books')
      .select('id', { count: 'exact', head: true })
      .eq('shelf_id', shelfId)
    const position = count ?? 0

    const { data, error } = await db
      .from('books')
      .insert({
        id,
        shelf_id: shelfId,
        title,
        cover_path: coverPath,
        thumb_path: thumbPath,
        spine_color: pickSpineColor(position + shelfId.charCodeAt(0)),
        position,
      })
      .select()
      .single()
    if (error) {
      // Don't leave orphaned photos behind if the row insert failed.
      await db.storage.from(COVERS_BUCKET).remove([coverPath, thumbPath])
      throw error
    }
    return toBook(data as BookRow)
  },

  async setRead(id, isRead) {
    const { data, error } = await client()
      .from('books')
      .update({ is_read: isRead, read_at: isRead ? new Date().toISOString() : null })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return toBook(data as BookRow)
  },

  async deleteBook(id) {
    const db = client()
    const { data, error } = await db.from('books').select('*').eq('id', id).single()
    if (error) throw error
    const row = data as BookRow
    const removed = await db.from('books').delete().eq('id', id)
    if (removed.error) throw removed.error
    await db.storage.from(COVERS_BUCKET).remove([row.cover_path, row.thumb_path])
  },

  async urlFor(path) {
    return client().storage.from(COVERS_BUCKET).getPublicUrl(path).data.publicUrl
  },
}
