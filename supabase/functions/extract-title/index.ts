// Reads one book's title off its cover photo and stores it for search.
//
// Called by the browser (fire-and-forget) with { bookId }. Never called during
// the add-book flow — the app queues books and drains them in the background.
//
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//   supabase functions deploy extract-title

import Anthropic from 'npm:@anthropic-ai/sdk@0.125.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

const BOOKS_TABLE = 'biblio_books'
const COVERS_BUCKET = 'biblio-covers'

/** Give up after this many tries so a stubborn photo can't bill forever. */
const MAX_ATTEMPTS = 3

const SYSTEM_PROMPT = [
  'You are reading a photograph of a physical book, usually a picture book for a child.',
  "Reply with only the book's title, exactly as it is printed on the cover.",
  'Do not include the author, the illustrator, the publisher, the series name, or any',
  'commentary, punctuation or quotation marks of your own.',
  'If no title is legible in the photo, reply with exactly: NONE',
].join(' ')

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })

const db = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } },
)

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

/** Pull the printed title out of the cover photo. Null when nothing is legible. */
async function readTitle(imageUrl: string): Promise<string | null> {
  const response = await anthropic.messages.create({
    model: 'claude-opus-5',
    max_tokens: 2000,
    output_config: { effort: 'low' },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: imageUrl } },
          { type: 'text', text: 'What is the title of this book?' },
        ],
      },
    ],
  })

  if (response.stop_reason === 'refusal') return null

  const title = response.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join(' ')
    .trim()

  if (!title || title.toUpperCase() === 'NONE') return null
  return title.slice(0, 120) // the column's own limit
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })

  let bookId: string | undefined
  try {
    bookId = (await request.json())?.bookId
  } catch {
    return json({ error: 'Send a JSON body of { bookId }.' }, 400)
  }
  if (!bookId) return json({ error: 'bookId is required.' }, 400)

  // One statement, so two phones opening the app at the same moment can't both
  // pay to read the same cover. No row back means the book is already read,
  // already claimed, or out of attempts. See 0003 for what it does.
  const { data: claims, error: claimError } = await db.rpc('biblio_claim_title', {
    book_id: bookId,
    max_attempts: MAX_ATTEMPTS,
  })

  if (claimError) return json({ error: claimError.message }, 500)
  const claimed = claims?.[0]
  if (!claimed) return json({ skipped: true })

  const { data: cover } = db.storage.from(COVERS_BUCKET).getPublicUrl(claimed.cover_path)

  try {
    const extracted = await readTitle(cover.publicUrl)
    const { error } = await db
      .from(BOOKS_TABLE)
      .update({
        extracted_title: extracted,
        title_status: 'done',
        title_updated_at: new Date().toISOString(),
      })
      .eq('id', bookId)
    if (error) throw error
    return json({ bookId, extractedTitle: extracted, titleStatus: 'done' })
  } catch (cause) {
    // Back to 'failed', not 'running', so the book is retried on a later open
    // until it runs out of attempts.
    await db
      .from(BOOKS_TABLE)
      .update({
        title_status: 'failed',
        title_updated_at: new Date().toISOString(),
      })
      .eq('id', bookId)
    const message = cause instanceof Error ? cause.message : 'The cover could not be read.'
    return json({ bookId, titleStatus: 'failed', error: message }, 500)
  }
})
