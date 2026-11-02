# Bookscape

**A cozy, personal library for books, essays, newsletters, clippings and research — that remembers what you pay attention to.**

[Live app](https://living-library-of-ideas.lovable.app) · Built with TanStack Start, React 19, Tailwind CSS v4 and Lovable Cloud

---

## Why

Reading lists are flat. Bookscape turns them into a room: shelves by theme, a reading desk, a guilty to-read pile on the floor, and a cat who notices when you finish something. Your shelf becomes a visual record of your attention.

## Features

**Library**
- Themed shelves ("rooms") for books, newsletters, clippings, articles, research papers and essays
- Starter collection on sign-up (e.g. *The Forest of Enchantments*, *Atomic Habits*, *You Had Me at Hello*, Nature and Feinstein research articles)
- Add and edit any item; new items go straight onto a genre shelf
- Create, rename-by-replacement and remove genres; books are reassigned before a shelf is removed
- Move books between shelves and arrange their order; arrangement persists
- Manual to-read pile on the floor — books only go there when you put them there
- Wear and tear: frequently opened spines fade and dog-ear; untouched ones stay pristine

**Finding things**
- Search across titles, authors and notes
- Filters by type, genre and status
- Room switcher, shelf view and flat list view
- ✨ Surprise me — opens a random item

**Reading desk**
- Pull a book out to open it on a desk with cover, newspaper or journal layouts
- Status tracking (to read, reading, read) and open counts
- Notes and highlights stacked beside the book as sticky notes
- In-app reader: load your own EPUB or text file, or paste an article; two-page spread, page-turn animation and sound, remembers your page; copies stay on your device
- Select text to highlight it or ask the **spoiler-free AI companion** what a line means
- A candle that burns down while you read

**Greeting and atmosphere**
- Greeting that nudges you ("still open on your desk", "saved weeks ago, never opened")
- Inspiring quote of the day, mixed with your own highlights
- Lighting that shifts with the time of day, fairy lights, page-turn sounds (mutable), reduced-motion support

**The cat**
- Name your cat; it greets you, purrs when petted, joins you at the desk and celebrates finished books

**Accounts**
- Email/password, Google and Lovable sign-in; each reader's library, genres and cat are private

## Tech

| Layer | Choice |
| --- | --- |
| App | TanStack Start (React 19, Vite 7), file-based routing |
| Styling | Tailwind CSS v4 with semantic design tokens |
| Data & auth | Lovable Cloud (Postgres with row-level security) |
| AI | Lovable AI Gateway via a server function |
| Reader | epub.js, IndexedDB for local copies |

## Run locally

```sh
npm i
npm run dev
```

Tests: `bunx vitest run`

## Journey

My first GitHub project — built iteratively with [Lovable](https://lovable.dev), one cozy detail at a time.
