import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COLORS, GENRES, KINDS } from "@/lib/library";
import { cn } from "@/lib/utils";

export function AddItemDialog({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    title: "", author: "", url: "", description: "", kind: "book", genre: "Fiction",
    color: "coral", reading_minutes: 300,
  });
  const set = (k: keyof typeof f, v: string | number) => setF((p) => ({ ...p, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("items").insert({ ...f, user_id: userId, status: "to_read" });
    if (error) return toast.error(error.message);
    toast.success("Added to your to-read pile.");
    qc.invalidateQueries({ queryKey: ["items"] });
    setOpen(false);
    setF({ ...f, title: "", author: "", url: "", description: "" });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>+ Add</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add to your library</DialogTitle></DialogHeader>
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
              <SelectContent>{GENRES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <label className="block text-sm text-muted-foreground">
            Reading time (minutes) — thicker spine for longer reads
            <Input type="number" min={1} value={f.reading_minutes} onChange={(e) => set("reading_minutes", Number(e.target.value))} />
          </label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button type="button" key={c} aria-label={c} onClick={() => set("color", c)}
                className={cn("h-7 w-7 rounded-full ring-offset-2", f.color === c && "ring-2 ring-ring")}
                style={{ backgroundColor: `var(--book-${c})` }} />
            ))}
          </div>
          <Button type="submit" className="w-full">Put it on the pile</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
