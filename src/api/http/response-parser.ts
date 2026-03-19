/**
 * Turns a `RawResponse` into a typed payload, or into the parsed `ApiError` body that
 * `error-mapper.ts` needs.
 *
 * arc PCI: there was a `console.debug('response body', text)` here. `dhotfix` removed it in
 * review with "we do not log response bodies, ever — a charge carries a card object and an
 * invoice carries a bank name". Do not add one back. See docs/adr/0003-no-card-data-in-the-console.md.
 */
import type { ApiError } from '@payzeno/contracts';

import { isApiErrorBody } from '../errors';

import { readRequestId, wasIdempotentReplay } from './headers';
import type { RawResponse } from './fetch-transport';

export interface ParsedResponse<T> {
  ok: true;
  status: number;
  data: T;
  requestId: string;
  /** payzeno-api replayed a stored idempotent response rather than doing the work again. */
  replayed: boolean;
}

export interface ParsedError {
  ok: false;
  status: number;
  requestId: string;
  /** Null when the body was empty or not JSON — nginx 502 pages, for example. */
  body: ApiError | null;
  raw: string | undefined;
}

export type ParseResult<T> = ParsedResponse<T> | ParsedError;

function tryParseJson(text: string | undefined): unknown {
