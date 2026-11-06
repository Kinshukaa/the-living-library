import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddItemDialog } from "@/components/library/AddItemDialog";
import { COLORS } from "@/lib/library";
import { cn } from "@/lib/utils";

type Pick = { title: string; author: string; genre: string; kind?: string };

export const AUTHORS: (Pick & { name: string })[] = [
  { name: "Chitra Banerjee Divakaruni", title: "The Forest of Enchantments", author: "Chitra Banerjee Divakaruni", genre: "Mythology" },
  { name: "Devdutt Pattanaik", title: "Jaya", author: "Devdutt Pattanaik", genre: "Mythology" },
  { name: "James Clear", title: "Atomic Habits", author: "James Clear", genre: "Non-fiction" },
  { name: "Robert Kiyosaki", title: "Rich Dad Poor Dad", author: "Robert Kiyosaki", genre: "Non-fiction" },
  { name: "David Brooks", title: "The Road to Character", author: "David Brooks", genre: "Philosophy" },
  { name: "Marcus Aurelius", title: "Meditations", author: "Marcus Aurelius", genre: "Philosophy" },
  { name: "Yuval Noah Harari", title: "Sapiens", author: "Yuval Noah Harari", genre: "Non-fiction" },
  { name: "Paulo Coelho", title: "The Alchemist", author: "Paulo Coelho", genre: "Fiction" },
  { name: "Haruki Murakami", title: "Norwegian Wood", author: "Haruki Murakami", genre: "Fiction" },
  { name: "Jane Austen", title: "Pride and Prejudice", author: "Jane Austen", genre: "Romance" },
  { name: "Colleen Hoover", title: "It Ends with Us", author: "Colleen Hoover", genre: "Romance" },
  { name: "J.K. Rowling", title: "Harry Potter and the Philosopher's Stone", author: "J.K. Rowling", genre: "Fantasy" },
  { name: "J.R.R. Tolkien", title: "The Hobbit", author: "J.R.R. Tolkien", genre: "Fantasy" },
  { name: "Andy Weir", title: "Project Hail Mary", author: "Andy Weir", genre: "Sci-fi" },
  { name: "Isaac Asimov", title: "Foundation", author: "Isaac Asimov", genre: "Sci-fi" },
  { name: "Matthew Walker", title: "Why We Sleep", author: "Matthew Walker", genre: "Health" },
  { name: "Subah Jain", title: "Satvic Revolution", author: "Subah Jain", genre: "Health" },
  { name: "Amitav Ghosh", title: "The Great Derangement", author: "Amitav Ghosh", genre: "Current affairs" },
  { name: "Arundhati Roy", title: "The God of Small Things", author: "Arundhati Roy", genre: "Fiction" },
  { name: "Ruskin Bond", title: "The Blue Umbrella", author: "Ruskin Bond", genre: "Fiction" },
];

export const READS: Pick[] = [
  { title: "Ikigai", author: "Héctor García", genre: "Philosophy" },
  { title: "The Psychology of Money", author: "Morgan Housel", genre: "Non-fiction" },
  { title: "Deep Work", author: "Cal Newport", genre: "Non-fiction" },
  { title: "Dune", author: "Frank Herbert", genre: "Sci-fi" },
  { title: "The Palace of Illusions", author: "Chitra Banerjee Divakaruni", genre: "Mythology" },
  { title: "Circe", author: "Madeline Miller", genre: "Mythology" },
  { title: "Man's Search for Meaning", author: "Viktor Frankl", genre: "Philosophy" },
  { title: "Normal People", author: "Sally Rooney", genre: "Romance" },
  { title: "The Midnight Library", author: "Matt Haig", genre: "Fiction" },
  { title: "Breath", author: "James Nestor", genre: "Health" },
  { title: "You Had Me at Hello", author: "Newsletter", genre: "Romance", kind: "newsletter" },
  { title: "The Morning Brew", author: "Newsletter", genre: "Current affairs", kind: "newsletter" },
];

export function MoveIn({ userId, genres, open, onDone }: { userId: string; genres: string[]; open: boolean; onDone: () => void }) {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [authors, setAuthors] = useState<string[]>([]);
  const [reads, setReads] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  async function finish() {
    setBusy(true);
    const picks = [...AUTHORS.filter(a => authors.includes(a.name)), ...READS.filter(r => reads.includes(r.title))];
    const shelf = (g: string) => (genres.includes(g) ? g : genres[0]);
    if (picks.length) {
      const { error } = await supabase.from("items").insert(picks.map((p, i) => ({
        user_id: userId, title: p.title, author: p.author, genre: shelf(p.genre), kind: p.kind ?? "book",
        placement: "shelf", status: "to_read", color: COLORS[i % COLORS.length], sort_order: i,
      })));
      if (error) { toast.error(error.message); setBusy(false); return; }
    }
    await supabase.from("profiles").update({ onboarded: true }).eq("id", userId);
    await qc.invalidateQueries({ queryKey: ["items"] });
    await qc.invalidateQueries({ queryKey: ["profile"] });
    setBusy(false);
    if (picks.length) toast.success(`${picks.length} favourites moved onto your shelves.`);
    onDone();
  }

  const chips = (opts: { key: string; label: string; sub?: string }[], sel: string[], set: (v: string[]) => void) => (
    <div className="flex max-h-[45vh] flex-wrap gap-2 overflow-y-auto py-1">
      {opts.map(o => (
        <button key={o.key} type="button" aria-pressed={sel.includes(o.key)} onClick={() => toggle(sel, set, o.key)}
          className={cn("rounded-full border px-3 py-1.5 text-left text-sm transition", sel.includes(o.key) ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}>
          {o.label}{o.sub && <span className="block text-[11px] opacity-70">{o.sub}</span>}
        </button>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl [&>button]:hidden">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Moving in · step {step + 1} of 3</p>
        {step === 0 && <>
          <DialogHeader><DialogTitle>Which authors do you love?</DialogTitle><DialogDescription>Pick as many as you like — we'll shelve one of their best-known books for you.</DialogDescription></DialogHeader>
          {chips(AUTHORS.map(a => ({ key: a.name, label: a.name, sub: a.title })), authors, setAuthors)}
        </>}
        {step === 1 && <>
          <DialogHeader><DialogTitle>Any favourite books or newsletters?</DialogTitle><DialogDescription>Tap the ones you've read or want to read.</DialogDescription></DialogHeader>
          {chips(READS.map(r => ({ key: r.title, label: r.title, sub: r.author })), reads, setReads)}
        </>}
        {step === 2 && <>
          <DialogHeader><DialogTitle>Now, add one of your own</DialogTitle><DialogDescription>Here's how adding a book works:</DialogDescription></DialogHeader>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>Type the <b>title</b> and <b>author</b> (emojis welcome 😊).</li>
            <li>Choose what it is — book, newsletter, article…</li>
            <li>Pick the <b>genre shelf</b> it belongs on.</li>
            <li>Leave “Genre shelf” selected, or choose the to-read pile yourself.</li>
            <li>Press <b>Put it on the shelf</b>. You can edit it any time.</li>
          </ol>
          <AddItemDialog userId={userId} genres={genres} trigger={<Button variant="secondary">📖 Add my first book</Button>} />
        </>}
        <div className="flex justify-between pt-2">
          <Button variant="ghost" onClick={() => (step ? setStep(step - 1) : finish())} disabled={busy}>{step ? "Back" : "Skip"}</Button>
          {step < 2
            ? <Button onClick={() => setStep(step + 1)}>Next</Button>
            : <Button onClick={finish} disabled={busy}>{busy ? "Moving in…" : "Finish moving in"}</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
