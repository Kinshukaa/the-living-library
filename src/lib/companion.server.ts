import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const RUN_ID = "X-Lovable-AIG-Run-ID";

const INSTRUCTIONS = `You are a warm, thoughtful reading companion inside a cozy personal library app.
The reader shares one line or passage from a book or article and asks what it means.
Explain in at most ~180 words, in plain language:
1. What the line means.
2. Why it matters: themes, metaphor, cultural or historical context.
3. One gentle reflective question connecting it to the reader's own life.
STRICT NO-SPOILER RULE: never reveal plot events, twists, character fates, endings, or anything that happens later in the work. Discuss only what the passage itself and general, spoiler-free context about the work and author show. If explaining fully would need a spoiler, say so and stop short.`;

export async function explainLine(input: { title: string; author: string | null; line: string }) {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new Error("AI is not configured.");
  let runId: string | undefined;
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (url, init) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set(RUN_ID, runId);
      const res = await fetch(url, { ...init, headers });
      runId ??= res.headers.get(RUN_ID) ?? undefined;
      return res;
    },
  });
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    instructions: INSTRUCTIONS,
    messages: [{ role: "user", content: `Work: "${input.title}"${input.author ? ` by ${input.author}` : ""}\nLine: "${input.line}"\nWhat does this mean and why does it matter? No spoilers please.` }],
    providerOptions: {
      openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] },
    },
  });
  return await result.text;
}
