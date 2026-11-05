import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export const TOUR_STEPS = [
  { icon: "🏡", title: "Welcome to your library", body: "Bookscape is a cosy room for everything you love to read: books, newsletters, clippings, essays and research. Here's a quick look around. It takes about a minute." },
  { icon: "📖", title: "Add what you read", body: "Tap “Add” to put a book, article or newsletter on a genre shelf. You can edit it any time. The to-read pile on the floor only holds things you choose to put there." },
  { icon: "🪵", title: "Shelves and rooms", body: "Each genre has its own shelf. Use the room buttons to visit one genre, “Arrange books” to reorder them, and “Shelves” to add or remove genres. Books you open often show wear, and unopened ones stay pristine." },
  { icon: "🔎", title: "Find anything", body: "Search titles and authors, filter by type, genre or status, switch to a simple list, or tap “Surprise me” to pull out something you've been ignoring." },
  { icon: "🕯️", title: "The reading desk", body: "Tap any spine to open it on the desk with your notes and highlights. Choose “Read here” to upload a PDF, EPUB or text file, or paste an article. Turn pages, highlight lines and ask the companion what a line means, with no spoilers. A candle burns while you read." },
  { icon: "📰", title: "Newsletters look like newspapers", body: "Newsletters and clippings sit on the shelf as folded newspapers tied with twine, and open in a print-style layout with a masthead and columns." },
  { icon: "🐾", title: "Meet your pet", body: "Your cat or dog lives in the corner. Tap to pet it, give it a name, switch between cat and dog, and feed it. It gets hungry every few hours and will remind you to come back." },
  { icon: "🎶", title: "Background music", body: "Open “Music” to play rain on the window, lo-fi beats, classical piano or a crackling fire, or import your own songs. Change the volume or turn it off whenever you like." },
  { icon: "🔔", title: "Can your pet send you reminders?", body: "Allow notifications and your pet can let you know when it's hungry, even while Bookscape is in another tab. You can change this later in your browser settings.", notify: true },
] as const;

export const tourKey = (userId: string) => `bookscape-tour-done-${userId}`;

export function WelcomeTour({ userId, open, onOpenChange }: { userId: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [step, setStep] = useState(0);
  const [perm, setPerm] = useState<string>("default");
  useEffect(() => { if (open) { setStep(0); setPerm(typeof Notification === "undefined" ? "unsupported" : Notification.permission); } }, [open]);
  const s = TOUR_STEPS[step]!;
  const last = step === TOUR_STEPS.length - 1;

  function finish() { localStorage.setItem(tourKey(userId), "1"); onOpenChange(false); }
  async function allow() {
    if (typeof Notification === "undefined") { toast("Your browser doesn't support notifications."); return; }
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p === "granted") { toast.success("Notifications are on."); new Notification("Bookscape", { body: "Your pet says hi. You'll hear from them when they're hungry." }); }
    else toast("No problem. Reminders will appear inside the app instead.");
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) finish(); }}>
      <DialogContent className="max-w-md">
        <div className="text-center text-5xl" aria-hidden>{s.icon}</div>
        <DialogTitle className="text-center font-display text-2xl">{s.title}</DialogTitle>
        <DialogDescription className="text-center text-base">{s.body}</DialogDescription>
        {"notify" in s && (
          <div className="text-center">
            {perm === "granted" ? <p className="text-sm font-medium text-primary">✓ Notifications allowed</p>
              : perm === "denied" ? <p className="text-sm text-muted-foreground">Notifications are blocked in your browser settings.</p>
              : <Button onClick={allow}>🔔 Allow notifications</Button>}
          </div>
        )}
        <div className="mt-2 flex justify-center gap-1.5" aria-hidden>
          {TOUR_STEPS.map((_, i) => <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === step ? "bg-primary" : "bg-muted"}`} />)}
        </div>
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={finish}>Skip tour</Button>
          <div className="flex gap-2">
            {step > 0 && <Button variant="secondary" onClick={() => setStep(step - 1)}>Back</Button>}
            {last ? <Button onClick={finish}>Start reading</Button> : <Button onClick={() => setStep(step + 1)}>Next</Button>}
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground">Step {step + 1} of {TOUR_STEPS.length}</p>
      </DialogContent>
    </Dialog>
  );
}
