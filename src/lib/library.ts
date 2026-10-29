import type { Database } from "@/integrations/supabase/types";

export type Item = Database["public"]["Tables"]["items"]["Row"];
export type Note = Database["public"]["Tables"]["notes"]["Row"];

export const GENRES = [
  "Mythology", "Philosophy", "Current affairs", "Romance", "Sci-fi",
  "Health", "Non-fiction", "Fantasy", "Fiction",
] as const;

export const KINDS = [
  { value: "book", label: "Book" },
  { value: "newsletter", label: "Newsletter" },
  { value: "clipping", label: "Newspaper clipping" },
  { value: "article", label: "Article" },
  { value: "research", label: "Research paper" },
  { value: "essay", label: "Essay" },
] as const;

export const STATUSES = [
  { value: "to_read", label: "To read" },
  { value: "reading", label: "Reading" },
  { value: "read", label: "Read" },
] as const;

export const COLORS = ["rose","amber","gold","teal","sage","lime","plum","coral","sky","indigo","stone"] as const;

export const kindLabel = (k: string) => KINDS.find((x) => x.value === k)?.label ?? k;
export const statusLabel = (s: string) => STATUSES.find((x) => x.value === s)?.label ?? s;

/** Spine thickness in px grows with reading time (minutes). */
export function spineWidth(minutes: number) {
  const w = 12 + Math.sqrt(Math.max(1, minutes)) * 1.5;
  return Math.round(Math.min(64, Math.max(12, w)));
}

export function spineHeight(kind: string, title: string) {
  const base = kind === "book" ? 150 : kind === "research" || kind === "article" ? 132 : 118;
  // a little variety so shelves look natural
  let h = 0;
  for (const c of title) h = (h * 31 + c.charCodeAt(0)) % 997;
  return base + (h % 24);
}

/** Wear: how faded & dog-eared a book looks. 0 pristine → 1 well-loved. */
export function wear(openCount: number) {
  return Math.min(1, openCount / 8);
}

export function formatMinutes(m: number) {
  if (m < 60) return `${m} min read`;
  const h = Math.round(m / 60);
  return `~${h} hr read`;
}

export function daysAgo(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export function humanAgo(iso: string) {
  const d = daysAgo(iso);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 14) return `${d} days ago`;
  if (d < 60) return `${Math.round(d / 7)} weeks ago`;
  return `${Math.round(d / 30)} months ago`;
}

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
export function timeOfDay(h = new Date().getHours()): TimeOfDay {
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

/** A greeting that does something: surface a neglected save. */
export function nudge(items: Item[]): { text: string; item?: Item } {
  const forgotten = items
    .filter((i) => i.open_count === 0 && daysAgo(i.created_at) >= 7)
    .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))[0];
  if (forgotten) return { text: `You saved “${forgotten.title}” ${humanAgo(forgotten.created_at)} and never opened it.`, item: forgotten };
  const reading = items.find((i) => i.status === "reading");
  if (reading) return { text: `“${reading.title}” is still open on your desk. Pick up where you left off?`, item: reading };
  const pile = items.filter((i) => i.status === "to_read").length;
  if (pile) return { text: `Your to-read pile has ${pile} things on it. It’s judging you, gently.` };
  return { text: "Everything’s read. Time to add something new." };
}

let ctx: AudioContext | null = null;
/** Synthesised page-turn swish — no audio files needed. */
export function playPageTurn() {
  if (typeof window === "undefined" || localStorage.getItem("bookscape-muted") === "1") return;
  try {
    ctx ??= new AudioContext();
    const dur = 0.35;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const t = i / d.length;
      d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * t) ** 2 * 0.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 2500;
    f.Q.value = 0.7;
    src.connect(f).connect(ctx.destination);
    src.start();
  } catch {
    /* ignore */
  }
}

export function playPurr() {
  if (typeof window === "undefined" || localStorage.getItem("bookscape-muted") === "1") return;
  try {
    ctx ??= new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    o.frequency.value = 45; lfo.frequency.value = 22; lg.gain.value = 0.15;
    lfo.connect(lg).connect(g.gain);
    g.gain.value = 0.15;
    o.connect(g).connect(ctx.destination);
    o.start(); lfo.start();
    const t = ctx.currentTime + 1.2;
    g.gain.linearRampToValueAtTime(0, t);
    o.stop(t); lfo.stop(t);
  } catch {
    /* ignore */
  }
}
