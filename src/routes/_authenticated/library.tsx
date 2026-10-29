import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookSpine } from "@/components/library/BookSpine";
import { ReadingDesk } from "@/components/library/ReadingDesk";
import { AddItemDialog } from "@/components/library/AddItemDialog";
import type { Item, TimeOfDay } from "@/lib/library";
import { GENRES, KINDS, STATUSES, kindLabel, nudge, playPurr, statusLabel, timeOfDay } from "@/lib/library";
import { cn } from "@/lib/utils";
import room from "@/assets/room.jpg";
import cat from "@/assets/cat.png";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({
    meta: [
      { title: "My library — Bookscape" },
      { name: "description", content: "Your shelves, your desk, your to-read pile." },
      { property: "og:title", content: "My library — Bookscape" },
      { property: "og:description", content: "Your shelves, your desk, your to-read pile." },
    ],
  }),
  component: Library,
});

const HELLO: Record<TimeOfDay, string> = { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening", night: "Still up" };

function Library() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("all");
  const [genre, setGenre] = useState("all");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState<"shelf" | "list">("shelf");
  const [room_, setRoom] = useState<string>("all");
  const [open, setOpen] = useState<Item | null>(null);
  const [tod, setTod] = useState<TimeOfDay>("afternoon");
  const [muted, setMuted] = useState(false);
  const [catWiggle, setCatWiggle] = useState(0);

  useEffect(() => {
    setTod(timeOfDay());
    setMuted(localStorage.getItem("bookscape-muted") === "1");
    const t = setInterval(() => setTod(timeOfDay()), 60000);
    return () => clearInterval(t);
  }, []);

  const items = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("items").select("*").order("created_at");
      if (error) throw error;
      return data as Item[];
    },
  });
  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()).data,
  });

  const all = items.data ?? [];
  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return all.filter((i) =>
      (!s || `${i.title} ${i.author ?? ""} ${i.description ?? ""}`.toLowerCase().includes(s)) &&
      (kind === "all" || i.kind === kind) &&
      (genre === "all" || i.genre === genre) &&
      (status === "all" || i.status === status) &&
      (room_ === "all" || i.genre === room_));
  }, [all, q, kind, genre, status, room_]);

  const pile = filtered.filter((i) => i.status === "to_read");
  const shelved = filtered.filter((i) => i.status !== "to_read");
  const byGenre = GENRES.map((g) => ({ g, list: shelved.filter((i) => i.genre === g) })).filter((x) => x.list.length);
  const hint = nudge(all);
  const name = profile.data?.display_name || "reader";
  const libName = profile.data?.library_name || "Bookscape";

  function surprise() {
    const pool = filtered.length ? filtered : all;
    if (!pool.length) return toast("Nothing to surprise you with yet.");
    const unopened = pool.filter((i) => i.open_count === 0);
    const from = unopened.length && Math.random() < 0.7 ? unopened : pool;
    setOpen(from[Math.floor(Math.random() * from.length)]);
  }

  async function renameLibrary() {
    const n = window.prompt("Name your library", libName);
    if (!n?.trim()) return;
    await supabase.from("profiles").update({ library_name: n.trim() }).eq("id", user.id);
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  function toggleMute() {
    const m = !muted; setMuted(m);
    localStorage.setItem("bookscape-muted", m ? "1" : "0");
  }

  return (
    <div className={cn("relative min-h-screen overflow-x-hidden", `tod-${tod}`)}>
      <img src={room} alt="" className="fixed inset-0 h-full w-full object-cover" width={1920} height={1088} />
      <div className="light-overlay fixed" />
      <div className="pointer-events-none fixed inset-x-0 top-3 flex justify-around">
        {Array.from({ length: 14 }).map((_, i) => <span key={i} className="fairy" style={{ animationDelay: `${i * 0.3}s`, marginTop: `${Math.sin(i) * 10 + 10}px` }} />)}
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-48 pt-10">
        {/* header & greeting */}
        <header className="glass rounded-3xl p-5 shadow-xl sm:p-7">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex-1">
              <button onClick={renameLibrary} className="group text-left" title="Rename library">
                <h1 className="text-4xl font-semibold sm:text-5xl">{libName} <span className="text-base opacity-0 group-hover:opacity-60">✎</span></h1>
              </button>
              <p className="mt-2 text-lg">{HELLO[tod]}, {name}.</p>
              <p className="mt-1 text-muted-foreground">
                {hint.text}{" "}
                {hint.item && <button className="font-semibold text-primary hover:underline" onClick={() => setOpen(hint.item!)}>Open it now</button>}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={surprise}>✨ Surprise me</Button>
              <AddItemDialog userId={user.id} />
              <Button variant="ghost" onClick={toggleMute} aria-label="Toggle sound">{muted ? "🔇" : "🔊"}</Button>
              <Button variant="ghost" onClick={signOut}>Sign out</Button>
            </div>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]">
            <Input placeholder="Search titles, authors, notes…" value={q} onChange={(e) => setQ(e.target.value)} className="bg-card" />
            <Filter value={kind} set={setKind} label="All types" opts={KINDS.map((k) => [k.value, k.label])} />
            <Filter value={genre} set={setGenre} label="All genres" opts={GENRES.map((g) => [g, g])} />
            <Filter value={status} set={setStatus} label="Any status" opts={STATUSES.map((s) => [s.value, s.label])} />
            <div className="flex rounded-md bg-muted p-1">
              {(["shelf", "list"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} className={cn("rounded px-3 text-sm", view === v && "bg-card shadow")}>{v === "shelf" ? "Shelves" : "List"}</button>
              ))}
            </div>
          </div>
        </header>

        {items.isLoading && <p className="mt-10 text-center">Dusting the shelves…</p>}

        {view === "shelf" ? (
          <>
            {/* rooms */}
            <nav className="mt-6 flex gap-2 overflow-x-auto pb-2">
              {["all", ...GENRES].map((g) => (
                <button key={g} onClick={() => setRoom(g)}
                  className={cn("glass shrink-0 rounded-full px-4 py-1.5 text-sm shadow", room_ === g && "bg-primary text-primary-foreground")}>
                  {g === "all" ? "Whole house" : `${g} room`}
                </button>
              ))}
            </nav>

            <section className="mt-4 grid gap-8 md:grid-cols-2">
              {byGenre.map(({ g, list }) => (
                <div key={g} className="glass rounded-2xl p-4 shadow-lg">
                  <h2 className="mb-2 text-xl font-semibold">{g}</h2>
                  <div className="flex min-h-40 flex-wrap items-end gap-[3px] [perspective:800px]">
                    {list.map((i) => <BookSpine key={i.id} item={i} onOpen={setOpen} />)}
                  </div>
                  <div className="shelf-plank" />
                </div>
              ))}
              {!items.isLoading && byGenre.length === 0 && (
                <p className="glass col-span-full rounded-2xl p-8 text-center">Nothing shelved here yet — open something from the pile.</p>
              )}
            </section>
          </>
        ) : (
          <div className="glass mt-6 overflow-x-auto rounded-2xl p-2 shadow-lg">
            <Table>
              <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Genre</TableHead><TableHead>Status</TableHead><TableHead>Opened</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {filtered.map((i) => (
                  <TableRow key={i.id} className="cursor-pointer" onClick={() => setOpen(i)}>
                    <TableCell><div className="font-semibold">{i.title}</div><div className="text-xs text-muted-foreground">{i.author}</div></TableCell>
                    <TableCell>{kindLabel(i.kind)}</TableCell><TableCell>{i.genre}</TableCell>
                    <TableCell>{statusLabel(i.status)}</TableCell><TableCell>{i.open_count}×</TableCell>
                    <TableCell>{i.url && <a href={i.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-primary hover:underline">Link</a>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* floor: to-read pile + cat */}
      {view === "shelf" && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 flex items-end justify-between px-4 pb-3">
          <div className="pointer-events-auto">
            <div className="glass mb-1 inline-block rounded-full px-3 py-0.5 text-xs shadow">To-read pile · {pile.length}{pile.length > 6 ? " (it’s growing…)" : ""}</div>
            <div className="flex max-h-[40vh] flex-col-reverse items-start overflow-visible">
              {pile.map((i, idx) => (
                <div key={i.id} style={{ transform: `translateX(${((idx * 13) % 17) - 8}px) rotate(${((idx * 29) % 9) - 4}deg)` }}>
                  <BookSpine item={i} onOpen={setOpen} lying />
                </div>
              ))}
            </div>
          </div>
          <button
            className={cn("pointer-events-auto w-36 sm:w-44", catWiggle && "cat-wiggle")}
            key={catWiggle}
            onClick={() => { playPurr(); setCatWiggle((c) => c + 1); toast("Prrrr. The cat approves of your reading choices."); }}
            aria-label="Pet the cat"
          >
            <img src={cat} alt="Sleeping cat" className="breathe" width={992} height={672} />
          </button>
        </div>
      )}

      {open && <ReadingDesk item={open} userId={user.id} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Filter({ value, set, label, opts }: { value: string; set: (v: string) => void; label: string; opts: (readonly [string, string])[] | string[][] }) {
  return (
    <Select value={value} onValueChange={set}>
      <SelectTrigger className="bg-card sm:w-40"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{label}</SelectItem>
        {opts.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
