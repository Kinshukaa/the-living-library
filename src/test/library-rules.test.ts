import { describe, expect, it } from "vitest";
import { itemDestination, orderedItems, shouldCelebrate } from "@/lib/library";
import type { Item } from "@/lib/library";

describe("Reader library rules", () => {
  it("places a new book on a shelf by default", () => {
    expect(itemDestination()).toBe("shelf");
  });
  it("uses the floor pile only when explicitly chosen", () => {
    expect(itemDestination("pile")).toBe("pile");
    expect(itemDestination("to_read")).toBe("shelf");
  });
  it("preserves the reader's chosen arrangement", () => {
    const items = [{ id: "b", sort_order: 2 }, { id: "a", sort_order: 1 }] as Item[];
    expect(orderedItems(items).map(i => i.id)).toEqual(["a", "b"]);
  });
  it("celebrates a book becoming complete, not repeated completed selections", () => {
    expect(shouldCelebrate("reading", "read")).toBe(true);
    expect(shouldCelebrate("read", "read")).toBe(false);
    expect(shouldCelebrate("to_read", "reading")).toBe(false);
  });
});