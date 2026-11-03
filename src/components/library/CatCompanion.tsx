import { useEffect, useRef, useState } from "react";
import { Heart, Bone, Fish, Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import cat from "@/assets/cat.png";
import dog from "@/assets/dog.png";
import { isHungry, petSound, REMINDER_EVERY_MS, type PetType } from "@/lib/pet";

type Props = {
  name: string;
  type: PetType;
  lastFedAt: string | null;
  celebration: number;
  onPet: () => void;
  onName: () => void;
  onFeed: () => void;
  onSwitchType: () => void;
  desk?: boolean;
};

export function CatCompanion({ name, type, lastFedAt, celebration, onPet, onName, onFeed, onSwitchType, desk = false }: Props) {
  const [x, setX] = useState(10);
  const [facingLeft, setFacingLeft] = useState(false);
  const [hearts, setHearts] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const lastReminder = useRef(0);
  const hungry = isHungry(lastFedAt, now);
  const Food = type === "dog" ? Bone : Fish;

  // Wander along the floor (not on the desk, not while reduced motion is on).
  useEffect(() => {
    if (desk || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      setX(prev => {
        const next = Math.round(Math.random() * 60);
        setFacingLeft(next < prev);
        return next;
      });
    }, 7000);
    return () => clearInterval(t);
  }, [desk]);

  // Gentle feeding reminders while the app is open.
  useEffect(() => {
    if (desk) return;
    const check = () => {
      const t = Date.now();
      setNow(t);
      if (!isHungry(lastFedAt, t) || t - lastReminder.current < REMINDER_EVERY_MS) return;
      lastReminder.current = t;
      const msg = `${name} is a little hungry. Come say hi and feed ${type === "dog" ? "him" : "her"}?`;
      toast(msg, { icon: "🍽️", action: { label: "Feed", onClick: onFeed } });
      if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) new Notification(name, { body: msg });
    };
    const first = setTimeout(check, 4000);
    const t = setInterval(check, 60_000);
    return () => { clearTimeout(first); clearInterval(t); };
  }, [desk, lastFedAt, name, type, onFeed]);

  function pet() { setHearts(h => h + 1); onPet(); }
  async function enableReminders() {
    if (typeof Notification === "undefined") return toast("Your browser doesn't support notifications.");
    const p = await Notification.requestPermission();
    toast(p === "granted" ? `${name} will nudge you when hungry.` : "Reminders will show only while the app is open.");
  }

  const burst = celebration + hearts;
  return <div className={cn(desk ? "pointer-events-auto mx-auto w-32" : "pointer-events-none min-w-0 flex-1")}>
    <div className={cn("pointer-events-auto relative flex flex-col items-center", desk ? "w-32" : "w-32 sm:w-40")} style={desk ? undefined : { marginLeft: `${x}%`, transition: "margin-left 6s ease-in-out" }}>
      {burst > 0 && <span key={burst} className="cat-hearts absolute -top-5 flex gap-3 text-primary" aria-label={`${name} is happy`}><Heart fill="currentColor" /><Heart fill="currentColor" /><Heart fill="currentColor" /></span>}
      {hungry && <span className="glass absolute -top-7 right-0 rounded-full px-2 py-0.5 text-xs shadow">hungry…</span>}
      <Button variant="ghost" className={cn("h-auto w-full p-0 hover:bg-transparent", burst > 0 && "cat-wiggle")} key={`pet-${burst}`} onClick={pet} aria-label={`Pet ${name}`} title={petSound(type)}>
        <img src={type === "dog" ? dog : cat} alt={name} className="breathe w-full" style={{ transform: facingLeft ? "scaleX(-1)" : undefined }} width={992} height={672} />
      </Button>
      <div className="flex flex-wrap justify-center gap-1">
        <Button variant="secondary" size="sm" className="h-auto min-h-8 max-w-full whitespace-normal break-words" onClick={onName} title="Rename your pet">{name} · ✎</Button>
        <Button variant={hungry ? "default" : "secondary"} size="sm" onClick={onFeed} aria-label={`Feed ${name}`}><Food className="size-4" /></Button>
        {!desk && <Button variant="ghost" size="sm" onClick={onSwitchType} title="Switch between cat and dog">{type === "dog" ? "🐈" : "🐕"}</Button>}
        {!desk && <Button variant="ghost" size="sm" onClick={enableReminders} aria-label="Enable feeding reminders"><Bell className="size-4" /></Button>}
      </div>
    </div>
  </div>;
}
