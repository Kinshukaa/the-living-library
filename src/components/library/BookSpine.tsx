import type { Item } from "@/lib/library";
import { spineHeight, spineWidth, wear } from "@/lib/library";
import { cn } from "@/lib/utils";

export function BookSpine({ item, onOpen, lying = false }: { item: Item; onOpen: (i: Item) => void; lying?: boolean }) {
  const w = spineWidth(item.reading_minutes);
  const h = spineHeight(item.kind, item.title);
  const worn = wear(item.open_count);
  const isPaper = item.kind !== "book";

  const style: React.CSSProperties = lying
    ? { width: h, height: Math.max(10, Math.round(w * 0.7)), backgroundColor: `var(--book-${item.color})` }
    : { width: w, height: h, backgroundColor: `var(--book-${item.color})` };
  style.filter = `saturate(${1 - worn * 0.55}) sepia(${worn * 0.35}) brightness(${1 - worn * 0.08})`;

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      title={`${item.title}${item.author ? " — " + item.author : ""}${item.open_count ? ` · opened ${item.open_count}×` : " · never opened"}`}
      className={cn(
        "book-spine shrink-0 overflow-hidden text-primary-foreground",
        worn >= 0.35 && "dog-ear",
        item.open_count === 0 && "pristine",
        isPaper && "rounded-sm",
        lying && "hover:!-translate-y-1 hover:![transform:translateY(-4px)]",
      )}
      style={style}
    >
      {isPaper && !lying && (
        <span className="absolute inset-x-0 top-2 mx-auto block h-1 w-3/5 rounded bg-paper/70" />
      )}
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center px-0.5 font-display text-[10px] font-semibold leading-tight drop-shadow",
          !lying && "[writing-mode:vertical-rl] rotate-180",
        )}
      >
        <span className="line-clamp-2">{item.title}</span>
      </span>
    </button>
  );
}
