import { useEffect, useState } from "react";

/** Burns down over ~60 minutes of open reading time. */
export function Candle() {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) setSecs(s => s + 1); }, 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0.12, 1 - secs / 3600);
  const mins = Math.floor(secs / 60);
  return (
    <div className="flex items-end gap-3 text-primary-foreground" title={`Reading for ${mins} min`}>
      <div className="relative flex w-8 flex-col items-center">
        <span className="candle-flame" />
        <span className="h-2 w-0.5 bg-foreground/70" />
        <span className="w-6 rounded-t-sm bg-paper shadow-inner transition-[height] duration-1000" style={{ height: `${Math.round(56 * left)}px` }} />
        <span className="h-1.5 w-10 rounded-full bg-muted-foreground" />
      </div>
      <span className="pb-1 text-xs opacity-80">{mins < 1 ? "Candle lit" : `${mins} min by candlelight`}</span>
    </div>
  );
}
