import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Item } from "@/lib/library";
import { playPageTurn } from "@/lib/library";
import { askCompanion } from "@/lib/companion.functions";

type Stored = { type: "text"; text: string } | { type: "epub"; data: ArrayBuffer };

// Copies stay on this device (IndexedDB), never uploaded.
function db() {
  return new Promise<IDBDatabase>((res, rej) => {
    const r = indexedDB.open("bookscape-reader", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("copies");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function getCopy(id: string): Promise<Stored | undefined> {
  const d = await db();
  return new Promise(res => { const q = d.transaction("copies").objectStore("copies").get(id); q.onsuccess = () => res(q.result); q.onerror = () => res(undefined); });
}
async function putCopy(id: string, v: Stored | null) {
  const d = await db();
  const s = d.transaction("copies", "readwrite").objectStore("copies");
  if (v) s.put(v, id); else s.delete(id);
}

export function paginate(text: string, size = 1100) {
  const paras = text.replace(/\r/g, "").split(/\n{2,}|\n/).map(p => p.trim()).filter(Boolean);
  const pages: string[][] = [[]];
  let len = 0;
  for (const p of paras) {
    let last = pages[pages.length - 1]!;
    if (len + p.length > size && last.length) { last = []; pages.push(last); len = 0; }
    last.push(p); len += p.length;
  }
  return pages;
}

export function InAppReader({ item, onHighlight }: { item: Item; onHighlight: (line: string) => Promise<void> }) {
  const [copy, setCopy] = useState<Stored | null | undefined>(undefined);
  const [paste, setPaste] = useState("");
  useEffect(() => { getCopy(item.id).then(c => setCopy(c ?? null)).catch(() => setCopy(null)); }, [item.id]);

  async function save(v: Stored) { await putCopy(item.id, v); setCopy(v); }
  async function onFile(f: File) {
    if (/\.epub$/i.test(f.name)) save({ type: "epub", data: await f.arrayBuffer() });
    else if (/\.(txt|md)$/i.test(f.name) || f.type.startsWith("text/")) save({ type: "text", text: await f.text() });
    else toast.error("Use an .epub or .txt file.");
  }

  if (copy === undefined) return null;
  if (!copy) return (
    <div className="paper-sheet space-y-3 rounded-xl p-6">
      <h3 className="text-2xl font-semibold">Read it right here</h3>
      <p className="font-sans text-sm text-muted-foreground">Add your own copy (EPUB or text), or paste an article. It stays on this device.</p>
      <label className="block font-sans text-sm">
        <span className="sr-only">Book file</span>
        <input type="file" accept=".epub,.txt,.md,text/plain" aria-label="Book file" onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} className="text-sm" />
      </label>
      <Textarea value={paste} onChange={e => setPaste(e.target.value)} placeholder="…or paste the text of an article or chapter" className="min-h-28 bg-card" />
      <Button disabled={!paste.trim()} onClick={() => save({ type: "text", text: paste })}>Open on the desk</Button>
    </div>
  );

  return (
    <div className="space-y-2">
      {copy.type === "text" ? <TextBook item={item} text={copy.text} onHighlight={onHighlight} /> : <EpubBook item={item} data={copy.data} onHighlight={onHighlight} />}
      <button className="font-sans text-xs text-primary-foreground/70 hover:underline" onClick={async () => { await putCopy(item.id, null); setCopy(null); }}>Remove my copy</button>
    </div>
  );
}

// Render **bold** and *italic* from the companion without showing raw asterisks.
export function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part.startsWith("*") && part.endsWith("*") && part.length > 2 ? <em key={i}>{part.slice(1, -1)}</em>
      : part);
}

function useSelectionTools(item: Item, onHighlight: (l: string) => Promise<void>) {
  const ask = useServerFn(askCompanion);
  const [sel, setSel] = useState("");
  const [answer, setAnswer] = useState<{ line: string; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  async function explain() {
    setBusy(true);
    try {
      const r = await ask({ data: { title: item.title, author: item.author, line: sel } });
      if (r.error) toast.error(r.error); else setAnswer({ line: sel, text: r.text });
    } catch { toast.error("The companion couldn't answer right now."); }
    setBusy(false);
  }
  const bar = sel ? (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-card p-2 font-sans text-sm shadow">
      <span className="line-clamp-1 max-w-xs italic text-muted-foreground">“{sel}”</span>
      <Button size="sm" onClick={async () => { await onHighlight(sel); setSel(""); window.getSelection()?.removeAllRanges(); toast.success("Highlighted."); }}>Highlight</Button>
      <Button size="sm" variant="secondary" disabled={busy} onClick={explain}>{busy ? "Thinking…" : "Ask companion (no spoilers)"}</Button>
    </div>
  ) : <p className="font-sans text-xs text-primary-foreground/80">Select a line to highlight it or ask what it means.</p>;
  const panel = answer && (
    <div className="paper-sheet relative rounded-lg p-4 font-sans text-sm leading-relaxed">
      <button className="absolute right-2 top-1 text-xs text-muted-foreground" onClick={() => setAnswer(null)} aria-label="Close explanation">✕</button>
      <p className="mb-2 font-display italic">“{answer.line}”</p>
      <p className="whitespace-pre-wrap">{renderInline(answer.text)}</p>
    </div>
  );
  return { setSel, bar, panel };
}

function TextBook({ item, text, onHighlight }: { item: Item; text: string; onHighlight: (l: string) => Promise<void> }) {
  const pages = useMemo(() => paginate(text), [text]);
  const key = `bookscape-page-${item.id}`;
  const [p, setP] = useState(0);
  const [flip, setFlip] = useState(0);
  const tools = useSelectionTools(item, onHighlight);
  useEffect(() => { setP(Number(localStorage.getItem(key)) || 0); }, [key]);
  function go(n: number) {
    const next = Math.max(0, Math.min(pages.length - 1 - ((pages.length - 1) % 2), n));
    if (next === p) return;
    playPageTurn(); setFlip(f => f + 1); setP(next); localStorage.setItem(key, String(next));
  }
  const capture = () => tools.setSel(window.getSelection()?.toString().trim() ?? "");
  const pageRef = useRef<HTMLDivElement>(null);
  const setSel = tools.setSel;
  // Phones select text by long-press without firing touchend reliably, so watch selection changes.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const onChange = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const s = window.getSelection();
        const txt = s?.toString().trim() ?? "";
        if (txt && s?.anchorNode && pageRef.current?.contains(s.anchorNode)) setSel(txt);
      }, 250);
    };
    document.addEventListener("selectionchange", onChange);
    return () => { clearTimeout(t); document.removeEventListener("selectionchange", onChange); };
  }, [setSel]);
  return (
    <div className="space-y-3">
      <div key={flip} ref={pageRef} onMouseUp={capture} onTouchEnd={capture}
        className="page-flip grid overflow-hidden rounded-xl shadow-2xl sm:grid-cols-2" style={{ borderLeft: `14px solid var(--book-${item.color})` }}>
        {[p, p + 1].map(i => (
          <div key={i} className="paper-sheet min-h-96 border-l p-6 font-display text-[17px] leading-relaxed sm:p-8">
            {pages[i]?.map((para, j) => <p key={j} className="mb-3">{para}</p>)}
            <p className="mt-4 text-center font-sans text-xs text-muted-foreground">{pages[i] ? i + 1 : ""}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="sm" onClick={() => go(p - 2)} disabled={p === 0}>↶ Back</Button>
        <span className="font-sans text-xs text-primary-foreground">Page {p + 1} of {pages.length}</span>
        <Button variant="secondary" size="sm" onClick={() => go(p + 2)} disabled={p + 2 >= pages.length}>Turn page ↷</Button>
      </div>
      {tools.bar}{tools.panel}
    </div>
  );
}

function EpubBook({ item, data, onHighlight }: { item: Item; data: ArrayBuffer; onHighlight: (l: string) => Promise<void> }) {
  const ref = useRef<HTMLDivElement>(null);
  const rend = useRef<{ next: () => void; prev: () => void; destroy?: () => void } | null>(null);
  const tools = useSelectionTools(item, onHighlight);
  const setSel = tools.setSel;
  useEffect(() => {
    let alive = true; let book: { destroy: () => void } | null = null;
    import("epubjs").then(({ default: ePub }) => {
      if (!alive || !ref.current) return;
      const b = ePub(data.slice(0)); book = b;
      const r = b.renderTo(ref.current, { width: "100%", height: 480, spread: "auto" });
      const loc = localStorage.getItem(`bookscape-epub-${item.id}`);
      r.display(loc || undefined);
      r.themes.default({ body: { "font-family": "Georgia, serif", "line-height": "1.6" } });
      r.on("relocated", (l: { start: { cfi: string } }) => localStorage.setItem(`bookscape-epub-${item.id}`, l.start.cfi));
      r.on("selected", (_cfi: string, contents: { window: Window }) => setSel(contents.window.getSelection()?.toString().trim() ?? ""));
      rend.current = r;
    });
    return () => { alive = false; book?.destroy(); };
  }, [data, item.id, setSel]);
  const turn = (d: 1 | -1) => { playPageTurn(); if (d > 0) rend.current?.next(); else rend.current?.prev(); };
  return (
    <div className="space-y-3">
      <div ref={ref} className="paper-sheet min-h-[480px] overflow-hidden rounded-xl p-2 shadow-2xl" style={{ borderLeft: `14px solid var(--book-${item.color})` }} />
      <div className="flex justify-between">
        <Button variant="secondary" size="sm" onClick={() => turn(-1)}>↶ Back</Button>
        <Button variant="secondary" size="sm" onClick={() => turn(1)}>Turn page ↷</Button>
      </div>
      {tools.bar}{tools.panel}
    </div>
  );
}
