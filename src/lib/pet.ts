export type PetType = "cat" | "dog";

/** A pet gets hungry this long after its last meal. */
export const HUNGER_AFTER_MS = 4 * 60 * 60 * 1000;
/** Gentle reminders repeat no more often than this while the app is open. */
export const REMINDER_EVERY_MS = 30 * 60 * 1000;

export function isHungry(lastFedAt: string | null | undefined, now = Date.now()) {
  if (!lastFedAt) return true;
  return now - new Date(lastFedAt).getTime() >= HUNGER_AFTER_MS;
}

export function petSound(type: PetType) {
  return type === "dog" ? "woof!" : "prrrrr…";
}

export function defaultPetName(type: PetType) {
  return type === "dog" ? "Biscuit" : "Mochi";
}
