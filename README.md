# Bookscape

**A cozy, personal library for books, essays, newsletters, clippings and research — that remembers what you pay attention to.**

[Live app](https://bookscapelivinglibrary.lovable.app) · Built with TanStack Start, React 19, Tailwind CSS v4 and Lovable Cloud

---

## Why

Reading lists are flat. Bookscape turns them into a room: shelves by theme, a reading desk, a guilty to-read pile on the floor, and a pet who notices when you finish something. Your shelf becomes a visual record of your attention.

## Features

**Library**
- Themed shelves ("rooms") for books, newsletters, clippings, articles, research papers and essays
- Starter collection on sign-up (e.g. *The Forest of Enchantments*, *Atomic Habits*, *You Had Me at Hello*, Nature and Feinstein research articles)
- Add and edit any item, with quick emoji buttons that drop into the title, author or note at your cursor
- New items land on a genre shelf; the floor pile only takes what you deliberately put there
- Create or remove genres; books on a removed shelf are reassigned first
- Move books between shelves and arrange their order — arrangement persists
- Wear and tear: frequently opened spines fade and dog-ear; untouched ones stay pristine

**Newsletters as newspapers**
- Newsletters and clippings sit on the shelf as folded broadsheets tied with twine, and open in a print layout with a masthead, columns and aged paper

**Finding things**
- Search across titles, authors and notes
- Filters by type, genre and status
- Room switcher, shelf view and flat list view
- ✨ Surprise me — opens a random item

**Reading desk**
- Pull a book out to open it on a desk with cover, newspaper or journal layouts
- Status tracking (to read, reading, read) and open counts
- Notes and highlights stacked beside the book as sticky notes
- In-app reader: upload a PDF, EPUB or text file, or paste an article — two-page spread, page-turn animation and sound, remembers your page, and copies stay on your device
- PDFs keep the original page numbering, so a line sits where it does in the real copy
- Select text to highlight it or ask the **spoiler-free AI companion** what a line means
- A candle that burns down while you read

**Greeting and atmosphere**
- Greeting that nudges you ("still open on your desk", "saved weeks ago, never opened")
- Quote of the day — an inspiring line, mixed with your own highlights when you have them
- Lighting that shifts with the time of day, fairy lights, page-turn sounds (mutable), reduced-motion support

**Your pet**
- Choose a cat or a dog, and name it whatever you like
- Pet it for hearts and a purr or woof; it joins you at the desk and celebrates finished books
- It gets hungry after a few hours, reminds you gently, and can send browser notifications even when the app is in another tab
- Sits put in the corner of the room — it doesn't wander

**Music**
- Gramophone player with volume control and on/off
- Curated soundscapes: rain on the window, lo-fi study beats, classical piano, fireplace crackle
- Import your own audio files; they stay on your device

**First visit**
- A guided tour of every feature, with a step that asks for notification permission
- An empty library that invites you to add a first book, instead of a blank room

**Accounts**
- Email/password and Google sign-in; each reader's library, genres and pet are private

## Tech

| Layer | Choice |
| --- | --- |
| App | TanStack Start (React 19, Vite 7), file-based routing |
| Styling | Tailwind CSS v4 with semantic design tokens |
| Data & auth | Lovable Cloud (Postgres with row-level security) |
| AI | Lovable AI Gateway via a server function |
| Reader | epub.js, pdf.js, IndexedDB for local copies |
| Audio | Web Audio soundscapes + IndexedDB for imported tracks |

## Run locally

```sh
npm i
npm run dev
```

Tests: `bunx vitest run`

## Roadmap

- **Detective board & mailbox:** link related items with yarn on a corkboard; new newsletter issues arrive as letters on the doormat
- **Conversational companion:** follow-up questions that keep the book and passage in context, still spoiler-free
- **One-click article import:** pull a newsletter or article straight from its link
- **Year-in-review room:** your most-worn books, genres and longest reading streak
- **Seasonal touches:** rain on the window and other weather that matches the room

## Journey

My first GitHub project — built iteratively with [Lovable](https://lovable.dev), one cozy detail at a time.
