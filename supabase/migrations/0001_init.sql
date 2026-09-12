-- BiblioZuri: shelves (sets of books) and the books photographed onto them.
-- The site has no login by design: the anonymous key may read, add and update,
-- but may not delete shelves, so a stray visitor cannot wipe the library.
--
-- Tables are prefixed biblio_ because this project is currently shared with
-- another, unrelated app; the prefix keeps the two cleanly separated.

create extension if not exists "pgcrypto";

create table if not exists public.biblio_shelves (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  accent text not null default '#2f8f79',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.biblio_books (
  id uuid primary key default gen_random_uuid(),
  shelf_id uuid not null references public.biblio_shelves (id) on delete cascade,
  title text check (title is null or char_length(title) <= 120),
  cover_path text not null,
  thumb_path text not null,
  spine_color text not null default '#c94f3d',
  is_read boolean not null default false,
  read_at timestamptz,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists biblio_books_shelf_id_idx on public.biblio_books (shelf_id);

alter table public.biblio_shelves enable row level security;
alter table public.biblio_books enable row level security;

-- Shelves: everyone may look, add and rename; nobody may delete from the site.
create policy "biblio shelves are readable" on public.biblio_shelves for select to anon, authenticated using (true);
create policy "biblio shelves can be added" on public.biblio_shelves for insert to anon, authenticated with check (true);
create policy "biblio shelves can be renamed" on public.biblio_shelves for update to anon, authenticated using (true) with check (true);

-- Books: readable, addable, updatable and removable (a mis-taken photo must go).
create policy "biblio books are readable" on public.biblio_books for select to anon, authenticated using (true);
create policy "biblio books can be added" on public.biblio_books for insert to anon, authenticated with check (true);
create policy "biblio books can be updated" on public.biblio_books for update to anon, authenticated using (true) with check (true);
create policy "biblio books can be removed" on public.biblio_books for delete to anon, authenticated using (true);
