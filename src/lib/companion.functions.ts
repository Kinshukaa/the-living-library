import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const askCompanion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { title: string; author: string | null; line: string }) => {
    const line = String(d.line ?? "").trim().slice(0, 1500);
    if (!line) throw new Error("Pick a line first.");
    return { title: String(d.title ?? "").slice(0, 300), author: d.author ? String(d.author).slice(0, 200) : null, line };
  })
  .handler(async ({ data }) => {
    const { explainLine } = await import("./companion.server");
    try {
      return { text: await explainLine(data), error: null as string | null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      console.error("companion failed", e);
      if (/402|credit/i.test(msg)) return { text: "", error: "AI credits have run out for now. Add credits to keep asking." };
      if (/429|rate/i.test(msg)) return { text: "", error: "The companion is busy. Try again in a minute." };
      return { text: "", error: "The companion couldn't answer right now." };
    }
  });
