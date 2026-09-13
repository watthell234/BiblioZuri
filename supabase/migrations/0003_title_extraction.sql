-- Title extraction: read each book's title off its cover photo so the library
-- can be searched. The extracted title is never shown in the UI — it only
-- feeds search, alongside any title a parent typed by hand.
--
-- Run this after 0001_init.sql and 0002_storage.sql.

alter table public.biblio_books
  add column if not exists extracted_title text,
  add column if not exists title_status text not null default 'pending',
  add column if not exists title_attempts int not null default 0,
  add column if not exists title_updated_at timestamptz;

-- 'pending'  waiting to be read          'running' a function has claimed it
-- 'done'     read (extracted_title may still be null if nothing was legible)
-- 'failed'   the last attempt threw      'skipped' never to be attempted
alter table public.biblio_books
  drop constraint if exists biblio_books_title_status_check;

alter table public.biblio_books
  add constraint biblio_books_title_status_check
  check (title_status in ('pending', 'running', 'done', 'failed', 'skipped'));

-- The default above is what starts the backfill: every book that already exists
-- is 'pending' the moment this runs, and the app drains the queue on next open.

-- Claiming a book to read has to be one statement: two phones opening the app
-- at the same moment must not both pay to read the same cover. Returns no row
-- when the book is already read, already claimed, or out of attempts.
--
-- A claim that never reports back (a function timeout) leaves the book
-- 'running'. STALE_AFTER lets a later attempt pick it up again, while the
-- attempt counter — incremented here, at claim time, not on the way out —
-- keeps a book that reliably kills the function from being retried forever.
create or replace function public.biblio_claim_title(book_id uuid, max_attempts int)
returns table (id uuid, cover_path text, title_attempts int)
language sql
as $$
  update public.biblio_books as b
     set title_status = 'running',
         title_attempts = b.title_attempts + 1,
         title_updated_at = now()
   where b.id = book_id
     and b.title_attempts < max_attempts
     and (
       b.title_status in ('pending', 'failed')
       or (b.title_status = 'running' and b.title_updated_at < now() - interval '5 minutes')
     )
  returning b.id, b.cover_path, b.title_attempts;
$$;
