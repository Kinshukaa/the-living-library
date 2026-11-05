import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Music, Pause, Play, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { SOUNDSCAPES, startSoundscape, type SoundscapeId } from "@/lib/soundscapes";

type Track = { id: string; name: string; blob: Blob };

// Your own songs stay on this device (IndexedDB), never uploaded.
function db() {
  return new Promise<IDBDatabase>((res, rej) => {
    const r = indexedDB.open("bookscape-music", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("tracks", { keyPath: "id" });
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
async function listTracks(): Promise<Track[]> {
  const d = await db();
  return new Promise(res => { const q = d.transaction("tracks").objectStore("tracks").getAll(); q.onsuccess = () => res(q.result as Track[]); q.onerror = () => res([]); });
}
async function saveTrack(t: Track) { (await db()).transaction("tracks", "readwrite").objectStore("tracks").put(t); }
async function deleteTrack(id: string) { (await db()).transaction("tracks", "readwrite").objectStore("tracks").delete(id); }

export function MusicPlayer() {
  const [playing, setPlaying] = useState<string | null>(null);
  const [volume, setVolume] = useState(50);
  const [tracks, setTracks] = useState<Track[]>([]);
  const ctx = useRef<AudioContext | null>(null);
  const gain = useRef<GainNode | null>(null);
  const stop = useRef<(() => void) | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setVolume(Number(localStorage.getItem("bookscape-music-volume") ?? 50));
    listTracks().then(setTracks).catch(() => {});
    return () => { stop.current?.(); audio.current?.pause(); ctx.current?.close(); };
  }, []);
  useEffect(() => {
    localStorage.setItem("bookscape-music-volume", String(volume));
    if (gain.current) gain.current.gain.value = (volume / 100) * 0.8;
    if (audio.current) audio.current.volume = volume / 100;
  }, [volume]);

  function halt() {
    stop.current?.(); stop.current = null;
    if (audio.current) { audio.current.pause(); URL.revokeObjectURL(audio.current.src); audio.current = null; }
    setPlaying(null);
  }
  function playScape(id: SoundscapeId) {
    if (playing === id) return halt();
    halt();
    if (!ctx.current) { ctx.current = new AudioContext(); gain.current = ctx.current.createGain(); gain.current.connect(ctx.current.destination); }
    void ctx.current.resume();
    gain.current!.gain.value = (volume / 100) * 0.8;
    stop.current = startSoundscape(ctx.current, gain.current!, id);
    setPlaying(id);
  }
  function playTrack(t: Track) {
    if (playing === t.id) return halt();
    halt();
    const a = new Audio(URL.createObjectURL(t.blob)); a.loop = true; a.volume = volume / 100;
    a.play().catch(() => toast.error("Couldn't play that file."));
    audio.current = a; setPlaying(t.id);
  }
  async function onFiles(files: FileList) {
    const added: Track[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("audio/") && !/\.(mp3|m4a|wav|ogg|aac|flac)$/i.test(f.name)) { toast.error(`${f.name} isn't an audio file.`); continue; }
      const t = { id: crypto.randomUUID(), name: f.name.replace(/\.[^.]+$/, ""), blob: f };
      await saveTrack(t); added.push(t);
    }
    if (added.length) { setTracks(ts => [...ts, ...added]); toast.success(`Added ${added.length} song${added.length > 1 ? "s" : ""}.`); }
  }

  const Row = ({ id, label, icon, onClick, onDelete }: { id: string; label: string; icon: React.ReactNode; onClick: () => void; onDelete?: () => void }) => (
    <div className={cn("flex items-center gap-2 rounded-md px-2 py-1.5", playing === id && "bg-primary/15")}>
      <span className="w-6 text-center" aria-hidden>{icon}</span>
      <span className="flex-1 truncate text-sm">{label}</span>
      <Button size="icon" variant="ghost" className="size-8" onClick={onClick} aria-label={`${playing === id ? "Pause" : "Play"} ${label}`}>{playing === id ? <Pause className="size-4" /> : <Play className="size-4" />}</Button>
      {onDelete && <Button size="icon" variant="ghost" className="size-8" onClick={onDelete} aria-label={`Remove ${label}`}><Trash2 className="size-4" /></Button>}
    </div>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" aria-label="Music player" data-tour="music" className={cn(playing && "text-primary")}>
          <Music className={cn("size-4", playing && "animate-pulse")} /> {playing ? "Playing" : "Music"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">The gramophone</h3>
          <Button size="sm" variant={playing ? "default" : "secondary"} disabled={!playing} onClick={halt}>{playing ? "Turn off" : "Off"}</Button>
        </div>
        <label className="mt-3 flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">Volume</span>
          <Slider aria-label="Music volume" value={[volume]} max={100} step={1} onValueChange={v => setVolume(v[0] ?? 0)} />
        </label>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Soundscapes</p>
        {SOUNDSCAPES.map(s => <Row key={s.id} id={s.id} label={s.label} icon={s.icon} onClick={() => playScape(s.id)} />)}
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your music</p>
        {tracks.map(t => <Row key={t.id} id={t.id} label={t.name} icon="🎵" onClick={() => playTrack(t)} onDelete={async () => { if (playing === t.id) halt(); await deleteTrack(t.id); setTracks(ts => ts.filter(x => x.id !== t.id)); }} />)}
        {!tracks.length && <p className="px-2 py-1 text-sm text-muted-foreground">No songs yet.</p>}
        <input ref={fileRef} type="file" accept="audio/*,.mp3,.m4a,.wav,.ogg" multiple hidden aria-label="Import songs" onChange={e => { if (e.target.files) void onFiles(e.target.files); e.target.value = ""; }} />
        <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => fileRef.current?.click()}><Upload className="size-4" /> Import MP3 or audio files</Button>
        <p className="mt-2 text-xs text-muted-foreground">Imported songs stay on this device.</p>
      </PopoverContent>
    </Popover>
  );
}
