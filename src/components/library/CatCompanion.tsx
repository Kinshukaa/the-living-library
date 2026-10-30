import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import cat from "@/assets/cat.png";

export function CatCompanion({ name, celebration, onPet, onName, desk = false }: { name: string; celebration: number; onPet: () => void; onName: () => void; desk?: boolean }) {
  return <div className={cn("pointer-events-auto relative flex flex-col items-center", desk ? "w-32 mx-auto" : "w-32 sm:w-40")}>
    {celebration > 0 && <span key={celebration} className="cat-hearts absolute -top-5 flex gap-3 text-primary" aria-label={`${name} is happy`}><Heart fill="currentColor" /><Heart fill="currentColor" /><Heart fill="currentColor" /></span>}
    <Button variant="ghost" className={cn("h-auto w-full p-0 hover:bg-transparent", celebration > 0 && "cat-wiggle")} key={`cat-${celebration}`} onClick={onPet} aria-label={`Pet ${name}`}><img src={cat} alt={name} className="breathe w-full" width={992} height={672} /></Button>
    <Button variant="secondary" size="sm" onClick={onName} title="Name your cat">{name} · ✎</Button>
  </div>;
}