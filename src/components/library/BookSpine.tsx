import type { Item } from "@/lib/library";
import { spineHeight, spineWidth, wear } from "@/lib/library";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function BookSpine({ item, onOpen, lying = false }: { item: Item; onOpen: (i: Item) => void; lying?: boolean }) {
  const w = spineWidth(item.reading_minutes);
  const h = spineHeight(item.kind, item.title);
  const worn = wear(item.open_count);
  const isPaper = item.kind !== "book";
  if (item.kind === "newsletter" || item.kind === "clipping") return <Broadsheet item={item} onOpen={onOpen} lying={lying} worn={worn} h={h} />;

  const style: React.CSSProperties = lying
    ? { width: h, height: Math.max(10, Math.round(w * 0.7)), backgroundColor: `var(--book-${item.color})` }
    : { width: w, height: h, backgroundColor: `var(--book-${item.color})` };
  style.filter = `saturate(${1 - worn * 0.55}) sepia(${worn * 0.35}) brightness(${1 - worn * 0.08})`;

  return (
    <Button variant="ghost"
      type="button"
      onClick={() => onOpen(item)}
      title={`${item.title}${item.author ? " — " + item.author : ""}${item.open_count ? ` · opened ${item.open_count}×` : " · never opened"}`}
      className={cn(
        "book-spine shrink-0 overflow-hidden p-0 whitespace-normal text-primary-foreground",
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
          !lying && "[writing-mode:vertical-rl]",
        )}
      >
        <span className="line-clamp-2">{item.title}</span>
      </span>
    </Button>
  );
}

/** Newsletters & clippings: a folded newspaper tied with twine, masthead and print columns. */
function Broadsheet({ item, onOpen, lying, worn, h }: { item: Item; onOpen: (i: Item) => void; lying: boolean; worn: number; h: number }) {
  const style: React.CSSProperties = lying ? { width: h + 10, height: 22 } : { width: 44, height: h };
  style.filter = `sepia(${0.15 + worn * 0.4})`;
  return (
    <button type="button" onClick={() => onOpen(item)} data-kind="broadsheet"
      aria-label={`${item.title} (${item.kind === "clipping" ? "newspaper clipping" : "newsletter"})`}
      title={`${item.title}${item.author ? " — " + item.author : ""}${item.open_count ? ` · opened ${item.open_count}×` : " · unread"}`}
      className={cn("book-spine broadsheet shrink-0 overflow-hidden", item.open_count === 0 && "pristine")} style={style}>
      {lying ? (
        <span className="absolute inset-0 flex items-center gap-1 px-2">
          <span className="truncate text-[9px] font-black uppercase tracking-tight">{item.title}</span>
          <span className="twine absolute inset-y-0 left-1/3 w-1" />
        </span>
      ) : (<>
        <span className="absolute inset-x-1 top-1 border-y border-current py-0.5 text-center text-[6px] font-black uppercase leading-none tracking-widest">{item.kind === "clipping" ? "Gazette" : "Letters"}</span>
        <span className="absolute inset-y-6 left-1 flex w-4 items-center justify-center [writing-mode:vertical-rl]">
          <span className="line-clamp-2 text-[9px] font-black uppercase leading-tight">{item.title}</span>
        </span>
        <span className="broadsheet-cols absolute bottom-3 right-1 top-6 w-3.5 opacity-70" />
        <span className="twine absolute inset-x-0 top-1/2 h-1" />
        <span className="absolute inset-y-0 right-0 w-px bg-current opacity-20" />
      </>)}
    </button>
  );
}
