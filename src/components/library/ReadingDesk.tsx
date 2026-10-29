import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Item, Note } from "@/lib/library";
import { STATUSES, formatMinutes, humanAgo, kindLabel, playPageTurn } from "@/lib/library";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function ReadingDesk({ item, userId, onClose }: { item: Item; userId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [flip, setFlip] = useState(0);
  const [text, setText] = useState("");
  const [noteKind, setNoteKind] = useState<"note" | "highlight">("highlight");

  useEffect(() => {
    playPageTurn();
    supabase.from("items")
      .update({ open_count: item.open_count + 1, last_opened_at: new Date().toISOString() })
      .eq("id", item.id)
      .then(() => qc.invalidateQueries({ queryKey: ["items"] }));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const notes = useQuery({
    queryKey: ["notes", item.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("notes").select("*").eq("item_id", item.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Note[];
    },
  });

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const { error } = await supabase.from("notes").insert({ item_id: item.id, user_id: userId, kind: noteKind, content: text.trim() });
    if (error) return toast.error(error.message);
    setText("");
    qc.invalidateQueries({ queryKey: ["notes", item.id] });
  }

  async function removeNote(id: string) {
    await supabase.from("notes").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["notes", item.id] });
  }

  async function setStatus(status: string) {
    await supabase.from("items").update({ status }).eq("id", item.id);
    qc.invalidateQueries({ queryKey: ["items"] });
    toast.success(status === "read" ? "Shelved. Nicely done." : "Updated.");
  }

  async function remove() {
    await supabase.from("items").delete().eq("id", item.id);
    qc.invalidateQueries({ queryKey: ["items"] });
    onClose();
  }

  function turn() { playPageTurn(); setFlip((f) => f + 1); }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-3 sm:items-center animate-in fade-in" onClick={onClose}>
      <div className="desk-surface relative max-h-[94vh] w-full max-w-6xl overflow-auto rounded-3xl p-5 shadow-2xl sm:p-8 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex flex-wrap items-center gap-3 text-primary-foreground">
          <span className="rounded-full bg-foreground/30 px-3 py-1 text-xs">{kindLabel(item.kind)} · {item.genre} · {formatMinutes(item.reading_minutes)}</span>
          <span className="text-xs opacity-80">Opened {item.open_count + 1}× · saved {humanAgo(item.created_at)}</span>
          <div className="ml-auto flex items-center gap-2">
            <Select defaultValue={item.status} onValueChange={setStatus}>
              <SelectTrigger className="w-32 bg-card text-card-foreground"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="secondary" onClick={onClose}>Back to shelf</Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div key={flip} className={cn(flip > 0 && "page-flip")}>
            {item.kind === "book" ? <OpenBook item={item} onTurn={turn} />
              : item.kind === "newsletter" || item.kind === "clipping" ? <Newspaper item={item} />
              : <Journal item={item} />}
          </div>

          <aside className="space-y-3">
            <form onSubmit={addNote} className="paper-sheet space-y-2 rounded-lg p-3">
              <div className="flex gap-1">
                {(["highlight", "note"] as const).map((k) => (
                  <button key={k} type="button" onClick={() => setNoteKind(k)}
                    className={cn("rounded-full px-3 py-1 text-xs", noteKind === k ? "bg-primary text-primary-foreground" : "bg-muted")}>
                    {k === "highlight" ? "Highlight" : "Note"}
                  </button>
                ))}
              </div>
              <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={noteKind === "highlight" ? "Paste a line you loved…" : "A thought…"} className="bg-card" />
              <Button type="submit" size="sm" className="w-full">Stick it on the desk</Button>
            </form>
            <div className="space-y-3">
              {notes.data?.map((n, i) => (
                <div key={n.id} className="sticky-note group relative rounded-sm p-3 text-xl leading-snug"
                  style={{ transform: `rotate(${((i * 37) % 7) - 3}deg)` }}>
                  {n.kind === "highlight"
                    ? <span className="bg-highlight px-1 [box-decoration-break:clone]">“{n.content}”</span>
                    : n.content}
                  <button onClick={() => removeNote(n.id)} className="absolute right-1 top-0 hidden font-sans text-xs text-muted-foreground group-hover:block">✕</button>
                </div>
              ))}
              {notes.data?.length === 0 && <p className="text-center text-sm text-primary-foreground/80">No notes yet. The desk is suspiciously tidy.</p>}
            </div>
            <button onClick={remove} className="w-full text-xs text-primary-foreground/70 hover:underline">Remove from library</button>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SourceLink({ url, label = "Read it online →" }: { url: string | null; label?: string }) {
  if (!url) return null;
  return <a href={url} target="_blank" rel="noreferrer" className="font-sans text-sm font-semibold text-primary underline-offset-4 hover:underline">{label}</a>;
}

function OpenBook({ item, onTurn }: { item: Item; onTurn: () => void }) {
  return (
    <div className="grid overflow-hidden rounded-xl shadow-2xl sm:grid-cols-2" style={{ borderLeft: `14px solid var(--book-${item.color})` }}>
      <div className="paper-sheet flex min-h-80 flex-col justify-center p-8 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{item.genre}</p>
        <h2 className="mt-3 text-4xl font-semibold">{item.title}</h2>
        {item.author && <p className="mt-3 italic">{item.author}</p>}
      </div>
      <div className="paper-sheet flex min-h-80 flex-col gap-4 border-l p-8">
        <p className="font-display text-lg leading-relaxed first-letter:float-left first-letter:mr-2 first-letter:text-5xl first-letter:font-bold">
          {item.description || "A story waiting for your attention."}
        </p>
        <div className="mt-auto flex items-center justify-between">
          <SourceLink url={item.url} />
          <Button variant="ghost" size="sm" onClick={onTurn}>Turn page ↷</Button>
        </div>
      </div>
    </div>
  );
}

function Newspaper({ item }: { item: Item }) {
  const date = new Date(item.created_at).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  return (
    <article className="newsprint rotate-[-0.6deg] rounded-sm p-6 sm:p-8">
      <header className="border-b-4 border-double border-paper-ink pb-2 text-center">
        <p className="text-xs uppercase tracking-widest">{item.kind === "newsletter" ? "The Weekly Letter" : "Clipping"} · {date}</p>
        <h2 className="text-4xl font-black sm:text-5xl">{item.author || "The Daily Shelf"}</h2>
      </header>
      <h3 className="mt-4 text-3xl font-bold leading-tight">{item.title}</h3>
      <div className="mt-4 gap-6 font-sans text-sm leading-relaxed sm:columns-2">
        <p className="first-letter:float-left first-letter:mr-1 first-letter:font-news first-letter:text-4xl first-letter:font-black">
          {item.description || "Saved for later."}
        </p>
        <p className="mt-3">Filed under {item.genre}. Roughly {formatMinutes(item.reading_minutes)}.</p>
        <p className="mt-3"><SourceLink url={item.url} label="Continue reading at the source →" /></p>
      </div>
    </article>
  );
}

function Journal({ item }: { item: Item }) {
  let host = "";
  try { host = item.url ? new URL(item.url).hostname.replace("www.", "") : ""; } catch { /* noop */ }
  return (
    <article className="paper-sheet rounded-md p-6 sm:p-10">
      <div className="flex items-center justify-between border-b pb-2 font-sans text-xs uppercase tracking-widest text-muted-foreground">
        <span>{kindLabel(item.kind)}</span><span>{host}</span>
      </div>
      <h2 className="mt-5 text-3xl font-semibold leading-tight">{item.title}</h2>
      {item.author && <p className="mt-2 font-sans text-sm italic text-muted-foreground">{item.author}</p>}
      <div className="mt-6 rounded-md bg-muted p-4">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest">Abstract</p>
        <p className="mt-2 font-display leading-relaxed">{item.description || "No summary yet."}</p>
      </div>
      <div className="mt-6"><SourceLink url={item.url} label="Open the full paper →" /></div>
    </article>
  );
}
