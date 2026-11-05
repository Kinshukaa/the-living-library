import { describe, expect, it } from "vitest";
import { SOUNDSCAPES } from "@/lib/soundscapes";
import { TOUR_STEPS, tourKey } from "@/components/library/WelcomeTour";

describe("music and tour", () => {
  it("offers the four curated soundscapes", () => {
    expect(SOUNDSCAPES.map(s => s.id)).toEqual(["rain", "lofi", "piano", "fire"]);
  });
  it("tour ends by asking for notification permission", () => {
    expect("notify" in TOUR_STEPS[TOUR_STEPS.length - 1]!).toBe(true);
  });
  it("tour is remembered per reader", () => {
    expect(tourKey("a")).not.toBe(tourKey("b"));
  });
});
