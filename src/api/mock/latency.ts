/**
 * Seeded jitter, so the `?mock=1` demo looks alive without looking random.
 *
 * The seed is the request path, which means the same route always takes the same time —
 * a Sales demo that stutters on a different table every run is worse than one that is
 * uniformly a bit slow.
 *
 * `sleep` comes from the real transport's retry module rather than being re-declared here:
 * the mock is a second `HttpTransport`, not a second stack.
 */
import { sleep } from '../http/retry';

const MIN_MS = 90;
const MAX_MS = 420;

/** FNV-1a. Small, deterministic, and it does not need to be cryptographic. */
function hash(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic delay in ms for a given seed, inside [MIN_MS, MAX_MS]. */
export function jitteredDelay(seed: string): number {
  const span = MAX_MS - MIN_MS;
  return MIN_MS + (hash(seed) % span);
}

/** Mutations feel heavier than reads, because they are. */
export function mutationDelay(seed: string): number {
  return jitteredDelay(seed) + 260;
}

/**
 * Every `MockTransport` method routes through here so the whole demo shares one latency
 * profile and a reviewer can slow the entire thing down by editing two constants.
 */
export async function withLatency<T>(seed: string, produce: () => T): Promise<T> {
  await sleep(jitteredDelay(seed));
  return produce();
}

export async function withMutationLatency<T>(seed: string, produce: () => T): Promise<T> {
  await sleep(mutationDelay(seed));
  return produce();
}
