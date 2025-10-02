/**
 * One MSW handler per api-surface.md §12 route.
 *
 * This file is what makes a hook test a real test. A hook mocked at the endpoint boundary
 * asserts that we called a function; a hook driven through here asserts that `usePayouts` →
 * `payouts.queries.ts` → `PayoutsEndpoint.list` → `ApiClient.get` → `ApiClient.request` →
 * `buildRequest` → `fetchTransport` produced `GET /v1/payouts?limit=25` and that the shape
 * coming back is the one `@payzeno/contracts` declares. Every frame in that chain is real.
 *
 * The base URL is `VITE_PAYZENO_API_URL` as set by `src/test/setup.ts`. Paths below are
 * version-free relative to it, exactly as the endpoint classes build them.
 *
 * Conventions:
 *  - handlers are permissive about query parameters and strict about paths, because the paths
 *    are the frozen contract and the parameters are not;
 *  - anything a test wants to fail is overridden per-case with `server.use(...)`, never by
 *    branching in here. A handler with an `if (shouldFail)` is a handler nobody can read.
 */
import { HttpResponse, http } from 'msw';

import type { Paginated } from '@payzeno/contracts';

import {
  makeApiKey,
  makeBalance,
  makeBankAccount,
  makeCharge,
  makeDashboardSummary,
  makeDispute,
  makeInvoice,
  makePage,
  makePaymentIntent,
  makePayout,
  makeReconciliationItem,
  makeRefund,
  makeSession,
  makeSettlementBatch,
  makeWebhookEndpoint,
  makeWebhookEvent,
} from '../factories';

/** Matches `src/test/setup.ts::TEST_ENV.VITE_PAYZENO_API_URL`. */
export const API_BASE = 'http://localhost/v1';

/** Absolute URL for a route path, so handlers and assertions never drift. */
export function url(path: string): string {
  return `${API_BASE}${path}`;
}

/** Every path any handler below is registered on. `routes.contract.test.ts` reads this. */
export const HANDLED_PATHS: ReadonlyArray<string> = [
  '/auth/me',
  '/auth/login',
  '/auth/logout',
  '/payment_intents',
  '/payment_intents/:paymentIntentId',
  '/payment_intents/:paymentIntentId/capture',
  '/payment_intents/:paymentIntentId/cancel',
  '/charges',
  '/charges/:chargeId',
  '/charges/:chargeId/ledger',
  '/refunds',
  '/disputes',
  '/disputes/:disputeId',
  '/disputes/:disputeId/evidence',
  '/balance',
  '/payouts',
  '/payouts/:payoutId',
  '/payouts/:payoutId/cancel',
  '/settlements',
  '/settlements/:batchId',
  '/settlements/:batchId/items',
  '/settlements/:batchId/items/:itemId/retry',
  '/invoices',
  '/invoices/:invoiceId',
  '/api-keys',
  '/api-keys/:apiKeyId',
  '/webhook_events',
  '/webhook_events/:eventId',
  '/webhook_endpoints',
  '/reporting/summary',
  '/reporting/volume',
  '/reporting/balance-history',
  '/bank-accounts',
  '/bank-accounts/:bankAccountId',
];

const requestIdHeaders = { 'X-Request-Id': 'req_msw_0000000000000001' };

function ok<T>(body: T, status = 200): HttpResponse {
  return HttpResponse.json(body as Record<string, unknown>, {
    status,
    headers: requestIdHeaders,
  });
}

function timeseries(points: number) {
  return Array.from({ length: points }, (_, index) => ({
    bucket_start: `2026-03-${String(8 + index).padStart(2, '0')}T00:00:00.000Z`,
    amount_minor: 120_000 + index * 4_500,
    count: 40 + index,
  }));
}

// ---------------------------------------------------------------------------
// §3 auth
// ---------------------------------------------------------------------------

const authHandlers = [
  http.get(url('/auth/me'), () => ok(makeSession())),

  http.post(url('/auth/login'), async ({ request }) => {
    const body = (await request.json()) as { email?: string };
    return ok({
      object: 'login',
      user: makeSession().user,
      merchant: makeSession().merchant,
      _echo_email: body.email,
    });
  }),

