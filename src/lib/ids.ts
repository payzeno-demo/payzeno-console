/**
 * Payzeno id prefixes.
 *
 * Every resource id is `<prefix>_<ulid>`. The console never mints a resource id — the API does
 * — but it does have to recognise one: to route a pasted id from the search box, to pick an
 * icon, and to refuse to send `ch_…` to a route that wants `pi_…`.
 *
 * Shape, not vocabulary. `@payzeno/contracts/ids::ID_PREFIXES` is keyed by the bare prefix and
 * carries owner metadata for the whole platform; this table is keyed by the console-facing
 * *kind*, because every call site here starts from "what am I looking at" rather than "what
 * does this string start with". Same discipline as payzeno-api's `API_ID_PREFIXES`.
 *
 * The prefix **values** are frozen by domain-model.md §0.2 and are not negotiable. This table
 * carried `ak` / `in` / `ltx` for a while — three prefixes that exist nowhere else in the
 * platform — and `parseId` silently returned null for every real api-key, invoice and ledger
 * transaction id the console was handed.
 *
 * The ULID body check is deliberately NOT reimplemented: `isUlid` from the contracts package
 * also rejects a first character above '7' (it encodes the top three bits of a 48-bit
 * millisecond timestamp), which the regex this module used to carry accepted.
 */
import { isUlid } from '@payzeno/contracts/ids';
import { ulid } from 'ulid';

export const ID_PREFIXES = {
  merchant: 'mch',
  user: 'usr',
  api_key: 'key',
  bank_account: 'ba',
  payment_intent: 'pi',
  charge: 'ch',
  refund: 're',
  dispute: 'dp',
  payout: 'po',
  settlement_batch: 'sb',
  reconciliation_item: 'ri',
  invoice: 'inv',
  webhook_event: 'evt',
  /**
   * `whe` has no counterpart in the contracts table: webhook endpoints are configuration, they
   * never appear in an event payload, and no other service dereferences one. Same exemption
   * payzeno-api takes for `stf_`.
   */
  webhook_endpoint: 'whe',
  ledger_transaction: 'txn',
  payment_method_token: 'pmt',
  bank_account_token: 'bat',
} as const;

export type ResourceKind = keyof typeof ID_PREFIXES;

const PREFIX_TO_KIND: ReadonlyMap<string, ResourceKind> = new Map(
  Object.entries(ID_PREFIXES).map(([kind, prefix]) => [prefix, kind as ResourceKind]),
);

/**
 * Split `ch_01HW…` into its parts. Null when the shape is wrong.
 *
 * Non-throwing on purpose, unlike `@payzeno/contracts/ids::parseId`: the caller here is a
 * search box being typed into, and every keystroke is an invalid id until the last one.
 */
export function parseId(value: string): { kind: ResourceKind; suffix: string } | null {
  const separator = value.indexOf('_');
  if (separator <= 0) return null;

  const prefix = value.slice(0, separator);
  const suffix = value.slice(separator + 1);
  const kind = PREFIX_TO_KIND.get(prefix);

  if (!kind || !isUlid(suffix)) return null;
  return { kind, suffix };
}

/** True when `value` is a well-formed id of the given kind. */
export function isId(value: string, kind: ResourceKind): boolean {
  return parseId(value)?.kind === kind;
}

/** Which resource a pasted id belongs to, for the command palette's jump-to behaviour. */
export function kindOf(value: string): ResourceKind | null {
  return parseId(value)?.kind ?? null;
}

/**
 * A client-generated correlation id, sent as `X-Request-Id` when the caller has not been given
 * one. Prefixed `req` so it is obviously not a resource id in a log line.
 */
export function newRequestId(): string {
  return `req_${ulid()}`;
}

/**
 * Idempotency keys deliberately do NOT live here.
 *
 * They are a transport concern, not an id-formatting one: a key identifies one mutation
 * *attempt* and has to be reused across transport retries of that attempt, which only
 * `api/http/idempotency.ts` knows how to arrange (`IdempotencyAttempt`). This module used to
 * carry a second `newIdempotencyKey()` that returned `idm_<ulid>` while the transport sent a
 * bare ULID — two formats for one wire header, and `Idempotency-Key` is matched byte-for-byte
 * by payzeno-api's `IdempotencyStore`. Import from `@api/http/idempotency` instead.
 */

/** Stable DOM id for a field, so `aria-describedby` on its error can point at something. */
export function fieldId(form: string, field: string): string {
  return `${form}-${field.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

/** `fieldId` + `-error`. Every form error element uses this and every input references it. */
export function fieldErrorId(form: string, field: string): string {
  return `${fieldId(form, field)}-error`;
}
