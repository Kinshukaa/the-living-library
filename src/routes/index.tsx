import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import room from "@/assets/room.jpg";
import cat from "@/assets/cat.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bookscape — your living library" },
      { name: "description", content: "A cozy, interactive shelf for books, essays, newsletters and research you love." },
      { property: "og:title", content: "Bookscape — your living library" },
      { property: "og:description", content: "A cozy, interactive shelf for books, essays, newsletters and research you love." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <img src={room} alt="Cozy reading corner with plants and fairy lights" className="absolute inset-0 h-full w-full object-cover" width={1920} height={1088} />
      <div className="glass relative max-w-xl rounded-3xl p-10 text-center shadow-2xl">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Welcome to</p>
        <h1 className="mt-2 text-6xl font-semibold">Bookscape</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          A shelf that remembers what you read. Books get dog-eared, saved articles pile up on the floor,
          and the lighting follows your day.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button size="lg" asChild><Link to="/library">Enter my library</Link></Button>
          <Button size="lg" variant="outline" asChild><Link to="/auth">Sign in</Link></Button>
        </div>
      </div>
      <img src={cat} alt="A sleeping cat" className="absolute bottom-6 right-10 w-40" width={992} height={672} />
    </main>
  );
}
