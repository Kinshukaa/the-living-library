import { useRef, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COLORS, GENRES, KINDS, STATUSES, itemDestination, shouldCelebrate } from "@/lib/library";
import type { Item } from "@/lib/library";
import { cn } from "@/lib/utils";

export function AddItemDialog({ userId, genres = [...GENRES], item, onComplete, trigger }: { userId: string; genres?: string[]; item?: Item; onComplete?: () => void; trigger?: React.ReactNode }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    title: item?.title ?? "", author: item?.author ?? "", url: item?.url ?? "", description: item?.description ?? "", kind: item?.kind ?? "book", genre: item?.genre ?? genres[0] ?? "Fiction",
    color: item?.color ?? "coral", reading_minutes: item?.reading_minutes ?? 300,
    placement: item?.placement ?? "shelf", status: item?.status ?? "to_read",
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string | number) => setF((p) => ({ ...p, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const values = { ...f, title: f.title.trim(), placement: itemDestination(f.placement), user_id: userId };
    const { error } = item
      ? await supabase.from("items").update(values).eq("id", item.id)
      : await supabase.from("items").insert({ ...values, sort_order: Date.now() });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (item && shouldCelebrate(item.status, f.status)) onComplete?.();
    toast.success(item ? "Book updated." : f.placement === "pile" ? "Added to your to-read pile." : "Added to your shelf.");
    qc.invalidateQueries({ queryKey: ["items"] });
    setOpen(false);
    if (!item) setF({ ...f, title: "", author: "", url: "", description: "", placement: "shelf" });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button variant={item ? "secondary" : "default"}>{item ? "Edit book" : "+ Add"}</Button>}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
        <DialogHeader><DialogTitle>{item ? "Edit your book" : "Add to your library"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <Input placeholder="Title" value={f.title} onChange={(e) => set("title", e.target.value)} required />
          <Input placeholder="Author or source" value={f.author} onChange={(e) => set("author", e.target.value)} />
          <Input type="url" placeholder="Link (https://…)" value={f.url} onChange={(e) => set("url", e.target.value)} />
          <Textarea placeholder="Why you saved it" value={f.description} onChange={(e) => set("description", e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Select value={f.kind} onValueChange={(v) => set("kind", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{KINDS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={f.genre} onValueChange={(v) => set("genre", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Array.from(new Set([...genres, f.genre])).map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">Destination
              <Select value={f.placement} onValueChange={(v) => set("placement", v)}>
                <SelectTrigger aria-label="Destination"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="shelf">Genre shelf</SelectItem><SelectItem value="pile">To-read pile</SelectItem></SelectContent>
              </Select>
            </label>
            <label className="text-sm">Reading status
              <Select value={f.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger aria-label="Reading status"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </label>
          </div>
          <label className="block text-sm text-muted-foreground">
            Reading time (minutes) — thicker spine for longer reads
            <Input type="number" min={1} value={f.reading_minutes} onChange={(e) => set("reading_minutes", Number(e.target.value))} />
          </label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <Button variant="ghost" type="button" key={c} aria-label={c} onClick={() => set("color", c)}
                className={cn("h-7 w-7 p-0 rounded-full ring-offset-2", f.color === c && "ring-2 ring-ring")}
                style={{ backgroundColor: `var(--book-${c})` }} />
            ))}
          </div>
          <Button type="submit" className="w-full" disabled={busy || !f.title.trim()}>{busy ? "Saving…" : item ? "Save changes" : f.placement === "pile" ? "Put it on the pile" : "Put it on the shelf"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
