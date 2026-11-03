import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CatCompanion } from "@/components/library/CatCompanion";

// The reader asked for the pet to stay put: it must never drift along the floor.
function renderPet() {
  render(
    <CatCompanion
      name="Mochi"
      type="cat"
      lastFedAt={null}
      celebration={0}
      onPet={() => {}}
      onName={() => {}}
      onFeed={() => {}}
      onSwitchType={() => {}}
    />,
  );
  return screen.getByRole("button", { name: "Pet Mochi" }).parentElement as HTMLElement;
}

describe("pet stays in place", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("does not move after half a minute on the shelf", () => {
    const pet = renderPet();
    expect(pet.hasAttribute("style")).toBe(false);

    vi.advanceTimersByTime(30_000);

    expect(pet.hasAttribute("style")).toBe(false);
  });
});
