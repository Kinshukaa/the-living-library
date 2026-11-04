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
import { ManageShelves } from "@/components/library/ManageShelves";
import { CatCompanion } from "@/components/library/CatCompanion";
import { defaultPetName, petSound, type PetType } from "@/lib/pet";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Item, TimeOfDay } from "@/lib/library";
import { GENRES, KINDS, STATUSES, kindLabel, nudge, playPurr, statusLabel, timeOfDay, orderedItems } from "@/lib/library";
import { cn } from "@/lib/utils";
import { quoteOfDay } from "@/lib/quotes";
import room from "@/assets/room.jpg";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({
    meta: [
      { title: "My library — Bookscape" },
      { name: "description", content: "Your shelves, your desk, your to-read pile." },
      { property: "og:title", content: "My library — Bookscape" },
      { property: "og:description", content: "Your shelves, your desk, your to-read pile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  const [arranging, setArranging] = useState(false);
  const [reordering, setReordering] = useState(false);

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

  const all = orderedItems(items.data ?? []);
  const genres = profile.data?.genres ?? [...GENRES];
  const petType: PetType = profile.data?.pet_type === "dog" ? "dog" : "cat";
  const catName = profile.data?.cat_name || defaultPetName(petType);
  const selectedItem = open ? all.find(i => i.id === open.id) ?? open : null;
  useEffect(() => {
    if (genre !== "all" && !genres.includes(genre)) setGenre("all");
    if (room_ !== "all" && !genres.includes(room_)) setRoom("all");
  }, [genres, genre, room_]);
  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return all.filter((i) =>
      (!s || `${i.title} ${i.author ?? ""} ${i.description ?? ""}`.toLowerCase().includes(s)) &&
      (kind === "all" || i.kind === kind) &&
      (genre === "all" || i.genre === genre) &&
      (status === "all" || i.status === status) &&
      (room_ === "all" || i.genre === room_));
  }, [all, q, kind, genre, status, room_]);

  const pile = filtered.filter((i) => i.placement === "pile");
  const shelved = filtered.filter((i) => i.placement !== "pile");
  const isEmpty = !items.isLoading && all.length === 0;
  const byGenre = genres.filter(g => (room_ === "all" || room_ === g) && (genre === "all" || genre === g)).map((g) => ({ g, list: shelved.filter((i) => i.genre === g) }));
  const hint = nudge(all);
  const highlights = useQuery({
    queryKey: ["highlights"],
    queryFn: async () => (await supabase.from("notes").select("content, item_id").eq("kind", "highlight").limit(50)).data ?? [],
  });
  const quote = quoteOfDay((highlights.data ?? []).map(h => ({ text: h.content, by: `your highlight from ${all.find(i => i.id === h.item_id)?.title ?? "your library"}` })));
  const name = profile.data?.display_name || "reader";
  const libName = profile.data?.library_name || "Bookscape";

  function celebrate() { if (petType === "cat") playPurr(); setCatWiggle(c => c + 1); toast(`${catName} ${petType === "dog" ? "wags happily" : "purrs happily"}. Another book finished!`); }
  function petCat() { if (petType === "cat") playPurr(); toast(`${catName}: ${petSound(petType)} Happy you're here.`); }
  async function savePet(patch: { cat_name?: string; pet_type?: PetType; pet_last_fed_at?: string }) {
    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...patch });
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["profile"] });
    return !error;
  }
  async function nameCat() {
    const value = window.prompt(`What is your ${petType}'s name?`, catName)?.trim();
    if (value) await savePet({ cat_name: value });
  }
  async function feedPet() {
    if (await savePet({ pet_last_fed_at: new Date().toISOString() })) { setCatWiggle(c => c + 1); toast(`${catName} munches happily. ${petType === "dog" ? "🦴" : "🐟"}`); }
  }
  async function switchPet() {
    const next: PetType = petType === "dog" ? "cat" : "dog";
    const renamed = catName === defaultPetName(petType) ? defaultPetName(next) : catName;
    await savePet({ pet_type: next, cat_name: renamed });
  }
  const petProps = { name: catName, type: petType, lastFedAt: profile.data?.pet_last_fed_at ?? null, celebration: catWiggle, onPet: petCat, onName: nameCat, onFeed: feedPet, onSwitchType: switchPet };
  async function shift(item: Item, direction: number) {
    const shelf = all.filter(i => i.genre === item.genre && i.placement === item.placement);
    const index = shelf.findIndex(i => i.id === item.id);
    const swap = shelf[index + direction];
    if (!swap) return;
    [shelf[index], shelf[index + direction]] = [swap, item];
    setReordering(true);
    const results = await Promise.all(shelf.map((i, position) => supabase.from("items").update({ sort_order: position }).eq("id", i.id)));
    const failed = results.find(r => r.error);
    if (failed?.error) toast.error(failed.error.message);
    await qc.invalidateQueries({ queryKey: ["items"] });
    setReordering(false);
  }

  function surprise() {
    const pool = filtered.length ? filtered : all;
    if (!pool.length) { toast("Nothing to surprise you with yet."); return; }
    const unopened = pool.filter((i) => i.open_count === 0);
    const from = unopened.length && Math.random() < 0.7 ? unopened : pool;
    setOpen(from[Math.floor(Math.random() * from.length)] ?? null);
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
              <blockquote className="mt-2 border-l-2 border-primary pl-3 font-display italic">“{quote.text}” <span className="not-italic text-sm text-muted-foreground">— {quote.by}</span></blockquote>
              <p className="mt-1 text-muted-foreground">
                {hint.text}{" "}
                {hint.item && <Button variant="link" className="px-0" onClick={() => { if (hint.item) setOpen(hint.item); }}>Open it now</Button>}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{catName} {petType === "dog" ? "wags their tail" : "stretches"}, happy to see you.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={surprise}>✨ Surprise me</Button>
              {!profile.isLoading && <AddItemDialog userId={user.id} genres={genres} key={genres.join("|")} />}
              {!profile.isLoading && <ManageShelves userId={user.id} genres={genres} items={all} />}
              <Button variant="ghost" onClick={toggleMute} aria-label="Toggle sound">{muted ? "🔇" : "🔊"}</Button>
              <Button variant="ghost" onClick={signOut}>Sign out</Button>
            </div>
          </div>

          {!isEmpty && <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]">
            <Input placeholder="Search titles, authors, notes…" value={q} onChange={(e) => setQ(e.target.value)} className="bg-card" />
            <Filter value={kind} set={setKind} label="All types" opts={KINDS.map((k) => [k.value, k.label])} />
            <Filter value={genre} set={setGenre} label="All genres" opts={genres.map((g) => [g, g])} />
            <Filter value={status} set={setStatus} label="Any status" opts={STATUSES.map((s) => [s.value, s.label])} />
            <div className="flex rounded-md bg-muted p-1">
              {(["shelf", "list"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} className={cn("rounded px-3 text-sm", view === v && "bg-card shadow")}>{v === "shelf" ? "Shelves" : "List"}</button>
              ))}
            </div>
          </div>}
        </header>

        {items.isLoading && <p className="mt-10 text-center">Dusting the shelves…</p>}

        {isEmpty && (
          <section className="mx-auto mt-10 max-w-xl">
            <div className="glass rounded-3xl p-8 text-center shadow-xl">
              <div className="text-5xl" aria-hidden>📚</div>
              <h2 className="mt-3 text-2xl font-semibold">Your shelves are waiting</h2>
              <p className="mt-2 text-muted-foreground">
                This is your own little library — books you love, newsletters you save, articles worth keeping.
                Add your first one and the shelves will start to feel like home.
              </p>
              {!profile.isLoading && (
                <AddItemDialog
                  userId={user.id}
                  genres={genres}
                  key={`empty-${genres.join("|")}`}
                  trigger={<Button size="lg" className="mt-5">📖 Add your first book</Button>}
                />
              )}
              <p className="mt-4 text-sm text-muted-foreground">
                It goes straight onto a genre shelf — the to-read pile is only for things you put there yourself.
              </p>
            </div>
          </section>
        )}

        {!isEmpty && (view === "shelf" ? (
          <>
            {/* rooms */}
            <nav className="mt-6 flex gap-2 overflow-x-auto pb-2">
              {["all", ...genres].map((g) => (
                <Button variant="ghost" key={g} onClick={() => setRoom(g)}
                  className={cn("glass shrink-0 rounded-full px-4 py-1.5 text-sm shadow", room_ === g && "bg-primary text-primary-foreground")}>
                  {g === "all" ? "Whole house" : `${g} room`}
                </Button>
              ))}
            </nav>
            <Button variant="secondary" size="sm" aria-pressed={arranging} onClick={() => setArranging(v => !v)}>{arranging ? "Done arranging" : "Arrange books"}</Button>

            <section className="mt-4 grid gap-8 md:grid-cols-2">
              {byGenre.map(({ g, list }) => (
                <div key={g} className="glass rounded-2xl p-4 shadow-lg">
                  <h2 className="mb-2 text-xl font-semibold">{g}</h2>
                  <div className="flex min-h-40 flex-wrap items-end gap-[3px] [perspective:800px]">
                    {list.map((i, index) => <div key={i.id} className="flex flex-col items-center gap-2">
                      <BookSpine item={i} onOpen={setOpen} />
                      {arranging && <div className="flex">
                        <Button variant="ghost" className="h-7 w-6 p-0" title="Move left" aria-label={`Move ${i.title} left`} disabled={reordering || index === 0} onClick={() => shift(i, -1)}><ArrowLeft /></Button>
                        <Button variant="ghost" className="h-7 w-6 p-0" title="Move right" aria-label={`Move ${i.title} right`} disabled={reordering || index === list.length - 1} onClick={() => shift(i, 1)}><ArrowRight /></Button>
                      </div>}
                    </div>)}
                    {!list.length && <span className="self-center text-sm text-muted-foreground">Empty shelf</span>}
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
        ))}
      </div>

      {/* floor: to-read pile + cat */}
      {view === "shelf" && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 flex items-end justify-between px-4 pb-3">
          {!isEmpty && (
            <div className="pointer-events-auto">
              <div className="glass mb-1 inline-block rounded-full px-3 py-0.5 text-xs shadow">To-read pile · {pile.length}{pile.length > 6 ? " (it’s growing…)" : ""}</div>
              <div className="flex max-h-[30vh] flex-col-reverse items-start overflow-y-auto overflow-x-hidden px-3 py-2">
                {pile.map((i, idx) => (
                  <div key={i.id} style={{ transform: `translateX(${((idx * 13) % 17) - 8}px) rotate(${((idx * 29) % 9) - 4}deg)` }}>
                    <BookSpine item={i} onOpen={setOpen} lying />
                  </div>
                ))}
              </div>
            </div>
          )}
          {!selectedItem && <CatCompanion {...petProps} />}
        </div>
      )}

      {selectedItem && <ReadingDesk item={selectedItem} userId={user.id} genres={genres} onComplete={celebrate} onClose={() => setOpen(null)} cat={<CatCompanion {...petProps} desk />} />}
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
