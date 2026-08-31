export type Clock = { now: () => Date };

export function createSeededRandom(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

export function createFixedClock(instant = "2026-01-01T00:00:00.000Z"): Clock {
  const timestamp = new Date(instant);
  if (Number.isNaN(timestamp.valueOf()))
    throw new Error("Invalid fixed clock instant");
  return { now: () => new Date(timestamp) };
}

export function createIdFactory(prefix = "id") {
  let counter = 0;
  return () => `${prefix}_${String(++counter).padStart(4, "0")}`;
}

export function createUuidFactory() {
  const nextId = createIdFactory("00000000-0000-4000-8000");
  return () => `${nextId()}-000000000000`;
}

export function boundedSequence<T>(
  values: readonly T[],
  limit = values.length,
): T[] {
  if (!Number.isInteger(limit) || limit < 0 || limit > values.length)
    throw new Error("Sequence limit is out of bounds");
  return values.slice(0, limit);
}

export function buildObject<T extends Record<string, unknown>>(
  defaults: T,
  overrides: Partial<T> = {},
): T {
  return { ...defaults, ...overrides };
}
