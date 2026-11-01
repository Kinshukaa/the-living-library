import { describe, it, expect } from "vitest";
import { quoteOfDay, QUOTES } from "@/lib/quotes";
import { paginate } from "@/components/library/InAppReader";
describe("quote of the day", () => {
  it("works with no highlights and stays the same all day", () => {
    const a = quoteOfDay([], new Date(2026, 10, 2, 8)); const b = quoteOfDay([], new Date(2026, 10, 2, 22));
    expect(QUOTES).toContainEqual(a); expect(a).toEqual(b);
  });
});
describe("reader pages", () => {
  it("splits long text into multiple pages", () => {
    expect(paginate(Array(10).fill("x".repeat(500)).join("\n\n")).length).toBeGreaterThan(3);
  });
});
