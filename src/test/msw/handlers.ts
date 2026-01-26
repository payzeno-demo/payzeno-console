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

  http.post(url('/auth/logout'), () => new HttpResponse(null, { status: 204 })),
];

// ---------------------------------------------------------------------------
// §5 payment intents
// ---------------------------------------------------------------------------

const paymentIntentHandlers = [
  http.get(url('/payment_intents'), () =>
    ok(
      makePage([
        makePaymentIntent(),
        makePaymentIntent({
          id: 'pi_01HW0RTPAYMENTINTENT0002',
          status: 'succeeded',
          capture_method: 'automatic',
        }),
      ]),
    ),
  ),

  http.get(url('/payment_intents/:paymentIntentId'), ({ params }) =>
    ok(makePaymentIntent({ id: String(params.paymentIntentId) })),
  ),

  http.post(url('/payment_intents/:paymentIntentId/capture'), ({ params }) =>
    ok(makePaymentIntent({ id: String(params.paymentIntentId), status: 'succeeded' })),
  ),

  http.post(url('/payment_intents/:paymentIntentId/cancel'), ({ params }) =>
    ok(
      makePaymentIntent({
        id: String(params.paymentIntentId),
        status: 'canceled',
        canceled_at: '2026-03-14T09:30:00.000Z',
      }),
    ),
  ),
];

// ---------------------------------------------------------------------------
// §6 charges
// ---------------------------------------------------------------------------

const chargeHandlers = [
  http.get(url('/charges'), () =>
    ok(
      makePage([
        makeCharge(),
        makeCharge({
          id: 'ch_01HW0RTCHARGE00000002',
          status: 'settled',
          currency: 'JPY',
          amount_minor: 1_200,
          captured_amount_minor: 1_200,
          settled_at: '2026-03-13T22:00:00.000Z',
        }),
        makeCharge({
          id: 'ch_01HW0RTCHARGE00000003',
          status: 'failed',
          failure_code: 'insufficient_funds',
          failure_message: 'The issuer declined this card.',
          captured_amount_minor: 0,
        }),
      ]),
    ),
  ),

  http.get(url('/charges/:chargeId'), ({ params }) =>
    ok(makeCharge({ id: String(params.chargeId) })),
  ),

  /** arc MIG step 2 — the double-entry view the legacy biller could never produce. */
  http.get(url('/charges/:chargeId/ledger'), ({ params }) =>
    ok({
      charge_id: String(params.chargeId),
      transactions: [
        {
          id: 'txn_01HW0RTLEDGERTXN000001',
          object: 'ledger_transaction',
          purpose: 'authorize',
          currency: 'GBP',
          entries: [],
          posted_at: '2026-03-14T08:00:05.000Z',
        },
        {
          id: 'txn_01HW0RTLEDGERTXN000002',
          object: 'ledger_transaction',
          purpose: 'capture',
          currency: 'GBP',
          entries: [],
          posted_at: '2026-03-14T08:02:01.000Z',
        },
      ],
    }),
  ),
];

// ---------------------------------------------------------------------------
// §7 refunds and disputes
// ---------------------------------------------------------------------------

const refundHandlers = [
  http.get(url('/refunds'), () => ok(makePage([makeRefund()]))),

  http.post(url('/refunds'), async ({ request }) => {
    const body = (await request.json()) as { charge_id: string; amount_minor?: number };
    return ok(
      makeRefund({
        charge_id: body.charge_id,
        amount_minor: body.amount_minor ?? 12_500,
        status: 'pending',
        succeeded_at: null,
      }),
      201,
    );
  }),
];

const disputeHandlers = [
  http.get(url('/disputes'), () =>
    ok(
      makePage([
        makeDispute(),
        makeDispute({
          id: 'dp_01HW0RTDISPUTE00000002',
          status: 'under_review',
          submitted_at: '2026-03-13T15:00:00.000Z',
        }),
      ]),
    ),
  ),

  http.get(url('/disputes/:disputeId'), ({ params }) =>
    ok(makeDispute({ id: String(params.disputeId) })),
  ),

  http.post(url('/disputes/:disputeId/evidence'), ({ params }) =>
    ok(
      makeDispute({
        id: String(params.disputeId),
        status: 'under_review',
        submitted_at: '2026-03-14T09:25:00.000Z',
      }),
    ),
  ),
];

// ---------------------------------------------------------------------------
// §8 balance, payouts, settlements
// ---------------------------------------------------------------------------

const balanceHandlers = [
  http.get(url('/balance'), ({ request }) => {
    const currency = new URL(request.url).searchParams.get('currency') ?? 'GBP';
    return ok(makeBalance({ currency: currency as 'GBP' }));
  }),
];

const payoutHandlers = [
  http.get(url('/payouts'), () =>
    ok(
      makePage([
        makePayout(),
        makePayout({
          id: 'po_01HW0RTPAYOUT00000002',
          status: 'failed',
          failure_code: 'bank_rejected',
          failed_at: '2026-03-13T18:00:00.000Z',
          reversal_transaction_id: 'txn_01HW0RTLEDGERTXN000009',
        }),
      ]),
    ),
  ),

  http.get(url('/payouts/:payoutId'), ({ params }) =>
    ok(makePayout({ id: String(params.payoutId) })),
  ),

  http.post(url('/payouts'), async ({ request }) => {
    const body = (await request.json()) as { amount_minor?: number; currency: string };
    return ok(
      makePayout({
        id: 'po_01HW0RTPAYOUTCREATED01',
        status: 'scheduled',
        amount_minor: body.amount_minor ?? 984_300,
        currency: body.currency as 'GBP',
        initiated_at: null,
      }),
      201,
    );
  }),

  http.post(url('/payouts/:payoutId/cancel'), ({ params }) =>
    ok(makePayout({ id: String(params.payoutId), status: 'canceled' })),
  ),
];

const settlementHandlers = [
  http.get(url('/settlements'), () =>
    ok(
      makePage([
        makeSettlementBatch(),
        makeSettlementBatch({
          id: 'sb_01HW0RTBATCH000000002',
          status: 'funded',
          funded_at: '2026-03-13T16:00:00.000Z',
        }),
      ]),
    ),
  ),

  http.get(url('/settlements/:batchId'), ({ params }) =>
    ok(makeSettlementBatch({ id: String(params.batchId) })),
  ),

  /**
   * arc PERF: the console asks for 50 here, not 500, and the endpoint sends the 30s read
   * timeout. Three items, one of which is the arc-INC duplicate suspect (settled after two
   * attempts) so `useSettlementItems`'s rollup has something to count.
   */
  http.get(url('/settlements/:batchId/items'), ({ params }) => {
    const batchId = String(params.batchId);
    const rows: Paginated<ReturnType<typeof makeReconciliationItem>> = makePage([
      makeReconciliationItem({ batch_id: batchId }),
      makeReconciliationItem({
        id: 'ri_01HW0RTITEM00000000002',
        batch_id: batchId,
        status: 'settled',
        attempt_count: 2,
        settled_transaction_id: 'txn_01HW0RTLEDGERTXN000003',
      }),
      makeReconciliationItem({
        id: 'ri_01HW0RTITEM00000000003',
        batch_id: batchId,
        status: 'orphaned',
        charge_id: null,
        expected_gross_minor: null,
        match_method: 'unmatched',
        matched_at: null,
      }),
    ]);
    return ok(rows);
