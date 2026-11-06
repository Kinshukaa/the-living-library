import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AddItemDialog, insertEmoji } from "@/components/library/AddItemDialog";

afterEach(cleanup);

describe("book emojis", () => {
  it("inserts an emoji at the cursor without removing surrounding text", () => {
    expect(insertEmoji("Atomic Habits", "📚", 6, 6)).toBe("Atomic📚 Habits");
    expect(insertEmoji("A note", "✨", 1, 5)).toBe("A✨e");
  });

  it("adds the chosen emoji to the focused book field", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AddItemDialog userId="reader-1" />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "+ Add" }));
    const title = screen.getByPlaceholderText("Title");
    fireEvent.change(title, { target: { value: "Atomic Habits" } });
    fireEvent.focus(title);
    fireEvent.click(screen.getByRole("button", { name: "Insert 📚 emoji" }));

    expect(title).toHaveValue("Atomic Habits📚");
  });
});
