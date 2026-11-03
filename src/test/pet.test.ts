import { describe, expect, it } from "vitest";
import { isHungry, HUNGER_AFTER_MS } from "@/lib/pet";

describe("pet feeding", () => {
  const now = Date.parse("2026-11-03T12:00:00Z");
  it("is hungry if never fed", () => expect(isHungry(null, now)).toBe(true));
  it("is not hungry 3 hours after a meal", () => expect(isHungry(new Date(now - 3 * 3600e3).toISOString(), now)).toBe(false));
  it("gets hungry 4 hours after a meal", () => {
    expect(HUNGER_AFTER_MS).toBe(4 * 3600e3);
    expect(isHungry(new Date(now - 4 * 3600e3).toISOString(), now)).toBe(true);
  });
});
