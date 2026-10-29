/**
 * `AdminMockTransport implements HttpTransport` — the admin app's `?mock=1`, the same seam
 * `MockTransport` is for the merchant console (ADR 0002). `AdminTransportProvider` picks it with
 * the same `shouldUseMock()`; nothing below the provider knows which transport it got.
 *
 * It answers from `admin-mock-db.ts`, which is stateful, so a demo can approve a merchant and
 * watch it leave the KYC queue. Failures go through `error-mapper.ts` like real ones: a 403 here
 * is a `ForbiddenError`, a 409 `settlement_locked` is a `ConflictApiError`.
 *
 * KYC document links point at the real api and do not resolve in mock mode — the documents
 * table says so instead of opening a broken tab.
 */
import type { ApiError } from '@payzeno/contracts';

import { isApiErrorBody } from '@api/errors';
import { toConsoleApiError } from '@api/http/error-mapper';
import { withLatency, withMutationLatency } from '@api/mock/latency';
import type { HttpTransport, QueryParams, RequestSpec } from '@api/transport';

import { makeStaffUser } from './admin-fixtures';
import { createAdminMockDb, routeAdminRequest } from './admin-mock-db';
import type { AdminMockDb, MockMethod } from './admin-mock-db';

export interface AdminMockTransportOptions {
  db?: AdminMockDb;
  /** Skip the seeded latency. Tests pass `true`. */
  instant?: boolean;
}

export class AdminMockTransport implements HttpTransport {
  readonly db: AdminMockDb;
  private readonly instant: boolean;

  constructor(options: AdminMockTransportOptions = {}) {
    // The demo starts signed in as an admin, so every section is visible on first load.
    this.db = options.db ?? createAdminMockDb({ signedInAs: makeStaffUser('admin') });
    this.instant = options.instant ?? false;
  }

  async request<TRes, TBody = unknown>(spec: RequestSpec<TBody>): Promise<TRes> {
    return this.dispatch<TRes>(spec.method, spec.path, spec.query, spec.body);
  }

  get<TRes>(path: string, query?: QueryParams): Promise<TRes> {
    return this.dispatch<TRes>('GET', path, query, undefined);
  }

  post<TRes, TBody>(path: string, body: TBody, _idempotencyKey: string): Promise<TRes> {
    return this.dispatch<TRes>('POST', path, undefined, body);
  }

  patch<TRes, TBody>(path: string, body: TBody, _idempotencyKey: string): Promise<TRes> {
    return this.dispatch<TRes>('PATCH', path, undefined, body);
  }

  async delete(path: string, _idempotencyKey: string): Promise<void> {
    await this.dispatch<void>('DELETE', path, undefined, undefined);
  }

  private async dispatch<TRes>(
    method: MockMethod,
    path: string,
    query: QueryParams | undefined,
    body: unknown,
  ): Promise<TRes> {
    const run = (): TRes => {
      const response = routeAdminRequest(this.db, { method, path, query, body });
      if (response.status >= 400) {
        const errorBody: ApiError | null = isApiErrorBody(response.body) ? response.body : null;
        throw toConsoleApiError({
          ok: false,
          status: response.status,
          requestId: 'mock',
          body: errorBody,
          raw: undefined,
        });
      }
      return response.body as TRes;
    };

    if (this.instant) return run();
    return method === 'GET' ? withLatency(path, run) : withMutationLatency(path, run);
  }
}
