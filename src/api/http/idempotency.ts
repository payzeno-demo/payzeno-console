/**
 * Idempotency keys — api-surface.md §1.3 requires one on every public POST/PATCH/DELETE.
 *
 * The contract that matters: a key identifies one *attempt*, not one request. A transport
 * retry of a 503 reuses the key (payzeno-api replays the stored response and sets
 * `Idempotent-Replay: true`); a user clicking "Refund" a second time is a new attempt and a
 * new key, and gets a second refund, which is what they asked for.
 */
import { ulid } from 'ulid';

export interface AttemptKey {
  key: string;
  createdAt: number;
}

/** Mints one key per mutation attempt. ULIDs sort lexicographically by time, which makes a
 * support ticket's "the key was ..." answerable without a database. */
export function newIdempotencyKey(): string {
  return ulid();
}

/**
 * Holds the key for the life of one attempt so `retry.ts` can reuse it across transport
 * retries. A new `IdempotencyAttempt` per call to `ApiClient.post/patch/delete`.
 */
export class IdempotencyAttempt {
  private readonly value: AttemptKey;

  constructor(existing?: string) {
    this.value = { key: existing ?? newIdempotencyKey(), createdAt: Date.now() };
  }

  get key(): string {
    return this.value.key;
  }

  get ageMs(): number {
    return Date.now() - this.value.createdAt;
  }

  /**
   * payzeno-api retains idempotency records for 24h (`IdempotencyRetentionJob`). A key older
   * than that has no stored response to replay, so reusing it is pointless.
   */
  isStale(): boolean {
    return this.ageMs > 24 * 60 * 60 * 1000;
  }
}

const RETENTION_HOURS = 24;

export function describeAttempt(attempt: IdempotencyAttempt): string {
  return `${attempt.key} (age ${Math.round(attempt.ageMs / 1000)}s, retained ${RETENTION_HOURS}h)`;
}
