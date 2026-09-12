import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

/** True once the site is built with Supabase credentials. */
export const hasSupabase = Boolean(url && key)

export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(url as string, key as string, { auth: { persistSession: false } })
  : null

// Prefixed because BiblioZuri currently shares a Supabase project with another
// app; the prefix keeps its tables and bucket unambiguous alongside that app's own.
export const COVERS_BUCKET = 'biblio-covers'
export const SHELVES_TABLE = 'biblio_shelves'
export const BOOKS_TABLE = 'biblio_books'
