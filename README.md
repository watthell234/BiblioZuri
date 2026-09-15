# BiblioZuri 🌳📚

A digital tree library for Zuri's books. Take a photo of a book, and it appears as a real
book standing on an illustrated wooden shelf — dim until she has read it, bright with a
gold leaf once she has.

## How it works

1. Tap **Add a book** (or the **+** button on a phone) — the camera opens.
2. The photo appears inside a drawn book cover, so you can see how it will look.
3. Choose the set it belongs to (or name a new one), add an optional title, and save.
4. The book lands on that set's tree, marked *not read*.
5. Tap the book to open it: your photo fills the right-hand page, and **I read it!**
   flips it to read — the canopy lamp's counter ticks up and leaves burst across the room.

Each set of books is its own tree. The lamp above every tree shows `read of total`.

## Where the library lives

All data access goes through `src/lib/library.ts`, which picks one of two backends:

| Built with Supabase keys | Backend | Library lives |
| --- | --- | --- |
| yes | `src/lib/supabaseBackend.ts` | Supabase (shared across all your devices) |
| no | `src/lib/localBackend.ts` | that browser only (IndexedDB + localStorage) |

There is no login: anyone with the site's address can see and edit the library. The
database policies allow reading, adding and updating, and allow removing a single book,
but not deleting whole shelves. If you later want a passcode or a real account, it is a
change to `src/lib/library.ts` and the policies in `supabase/migrations/` — the rest of
the app does not care.

## Setup

### 1. Supabase

Create a project, then run the files in `supabase/migrations/` (SQL editor, in order):

- `0001_init.sql` — the `shelves` and `books` tables and their access policies
- `0002_storage.sql` — the public `covers` bucket for the photos
- `0003_title_extraction.sql` — the title columns and the claim function behind search

Then deploy the function that reads the covers, which needs the
[Supabase CLI](https://supabase.com/docs/guides/local-development):

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...   # never a VITE_ variable
supabase functions deploy extract-title
```

Without it everything still works — books just aren't searchable by the titles
printed on their covers.

### 2. Local development

```bash
npm install
cp .env.example .env.local   # fill in your project URL and publishable key
npm run dev
```

Without `.env.local` the app still runs — it just keeps the library in your own browser,
which is handy for trying things out.

### 3. Deploying to GitHub Pages

- Repository **Settings → Pages → Source = GitHub Actions** (one time).
- Repository **Settings → Secrets and variables → Actions → Variables**, add:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`

  Both are client-side public values, which is why they are variables rather than secrets.
- Pushing to `main` builds and publishes to `https://<user>.github.io/BiblioZuri/`.

On a phone, open that address and use *Add to Home Screen* — it then behaves like an app,
and the camera opens straight into the add-book flow.

## Titles and search

The title box in the add-book sheet is optional, and mostly stays empty — so the
library reads each title off the cover photo itself, and the search box at the top
matches both.

It happens **in the background**, never while a book is being added: saving a book
is exactly as quick as it was. Every book starts out `pending`, including all the
books that existed before this feature, and the app works through that queue two
at a time whenever it opens. A book added on a phone becomes searchable a moment
later without a reload.

The extracted title is **never shown** — a book still displays the photo and
whatever title was typed. It exists only so that searching for a word on the
cover finds the book.

The reading is done by `supabase/functions/extract-title`, which passes the cover
to Claude and writes the answer back. Two details are worth knowing:

- **It costs money per photo**, and the function is callable by anyone who knows
  the address — the same as the rest of the app, which has no login. What bounds
  it: the function only acts on books that already exist, only on ones still
  waiting for a title, and gives up after three attempts each. Books are claimed
  in a single statement, so two phones opening the app together can't both pay to
  read the same cover. If that stops being good enough, a shared secret on the
  function is the next step.
- **Search is done in the browser** over the library it already has in memory,
  so it needs no index. If the library ever grows past what one fetch can carry,
  that is the moment to move search into Postgres with a `pg_trgm` index.

## Photos

Camera photos are downscaled in the browser before upload: a ~1200px cover and a ~320px
thumbnail, both JPEG. A phone photo of several megabytes becomes a couple of hundred
kilobytes, so the shelves load fast and the free storage tier lasts a long time.

## Project layout

```
src/lib/          data layer (backends, image processing, title queue, hooks)
src/components/   the room, trees, books, add sheet, opened book, search, celebration
src/styles/       the illustrated library: room.css, book.css, ui.css, base.css
supabase/         SQL migrations and the extract-title edge function
```
