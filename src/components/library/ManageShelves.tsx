import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Item } from "@/lib/library";

export function ManageShelves({ userId, genres, items }: { userId: string; genres: string[]; items: Item[] }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(next: string[]) {
    const { error } = await supabase.from("profiles").upsert({ id: userId, genres: next });
    if (error) throw error;
    await qc.invalidateQueries({ queryKey: ["profile"] });
  }
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const value = name.trim();
    if (!value || genres.some(g => g.toLowerCase() === value.toLowerCase())) return;
    setBusy(true);
    try { await save([...genres, value]); setName(""); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not add genre."); }
    finally { setBusy(false); }
  }
  async function remove(genre: string) {
    const count = items.filter(i => i.genre === genre).length;
    const destination = target !== genre && genres.includes(target) ? target : "";
    if (count && !destination) { toast.error("Choose a destination for this genre's books first."); return; }
    setBusy(true);
    try {
      if (count) {
        const { error } = await supabase.from("items").update({ genre: destination }).eq("user_id", userId).eq("genre", genre);
        if (error) throw error;
      }
      await save(genres.filter(g => g !== genre));
      await qc.invalidateQueries({ queryKey: ["items"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not remove genre."); }
    finally { setBusy(false); }
  }
  return <Dialog>
    <DialogTrigger asChild><Button variant="secondary">Manage genres</Button></DialogTrigger>
    <DialogContent className="max-h-[85vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Your genres</DialogTitle></DialogHeader>
      <form onSubmit={add} className="flex gap-2"><Input aria-label="New genre" placeholder="New genre" value={name} onChange={e => setName(e.target.value)} /><Button type="submit" size="icon" aria-label="Add genre" disabled={busy || !name.trim()}><Plus /></Button></form>
      <label className="text-sm">Move books from a removed genre to
        <Select value={target} onValueChange={setTarget}><SelectTrigger aria-label="Move removed genre books to"><SelectValue placeholder="Choose a genre" /></SelectTrigger><SelectContent>{genres.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
      </label>
      <div className="divide-y">{genres.map(g => <div key={g} className="flex items-center justify-between py-2"><span>{g} <span className="text-muted-foreground">· {items.filter(i => i.genre === g).length}</span></span><Button variant="ghost" size="icon" aria-label={`Remove ${g}`} title={`Remove ${g}`} disabled={busy || genres.length <= 1} onClick={() => remove(g)}><Trash2 /></Button></div>)}</div>
    </DialogContent>
  </Dialog>;
}