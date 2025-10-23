/**
 * Test factories (tests.md §2.3).
 *
 * Every factory returns a `@payzeno/contracts` type verbatim — not a partial, not a loose
 * object literal. That is deliberate: a factory typed as `Partial<Charge>` compiles against a
 * renamed field and the whole point of the shared package evaporates. When `osquash` bumps
 * `@payzeno/contracts` and a field moves, these are the files that break first, and that is
 * the early warning we want.
 *
 * Values are deterministic. Nothing here reads `Date.now()` or `Math.random()`, because a
 * settlement rollup assertion that changes at midnight is worse than no assertion.
 */
import type {
  ApiKey,
  BankAccount,
  Balance,
  Charge,
  DashboardSummary,
  Dispute,
  Invoice,
  Merchant,
  MerchantSettlementBatch,
  Paginated,
  PaymentIntent,
  Payout,
  ReconciliationItem,
  Refund,
  SessionResponse,
  User,
  WebhookEndpoint,
  WebhookEvent,
} from '@payzeno/contracts';

import { toConsoleSession } from '@/types/session';
import type { ConsoleSession } from '@/types/session';
import type { ConsoleNotification } from '@features/notifications/notification.types';

/** Fixed instant every timestamp below is derived from: 2026-03-14T09:21:07.412Z. */
export const NOW = '2026-03-14T09:21:07.412Z';
/** `GET /v1/auth/me`. `permissions` is populated, so `toConsoleSession` uses it verbatim. */
export function makeSession(overrides: Partial<SessionResponse> = {}): SessionResponse {
  return {
    object: 'session',
    user: makeUser(),
    merchant: makeMerchant(),
    permissions: [
      'payments:read',
      'payments:write',
      'refunds:write',
      'disputes:read',
      'disputes:write',
      'balance:read',
      'payouts:read',
      'payouts:write',
      'settlements:read',
      'settlements:retry',
      'invoices:read',
      'developers:read',
      'developers:write',
      'reporting:read',
      'settings:read',
      'settings:write',
      'team:invite',
    ],
    ...overrides,
  };
}

/** The session shape the providers actually hold — `SessionResponse` plus the console's bits. */
export function makeConsoleSession(overrides: Partial<SessionResponse> = {}): ConsoleSession {
  return toConsoleSession(makeSession(overrides));
}

export function makePaymentIntent(overrides: Partial<PaymentIntent> = {}): PaymentIntent {
  return {
    id: 'pi_01HW0RTPAYMENTINTENT0001',
    object: 'payment_intent',
    merchant_id: MERCHANT_ID,
    amount_minor: 12_500,
    currency: 'GBP',
    status: 'requires_capture',
    capture_method: 'manual',
    customer_reference: 'cust-8814',
    description: 'Order 8814',
    statement_descriptor: 'NORTHWIND',
    latest_charge_id: 'ch_01HW0RTCHARGE00000001',
    client_secret: 'pi_01HW0RTPAYMENTINTENT0001_secret_do_not_render',
    next_action: null,
    livemode: true,
    metadata: {},
    created_at: '2026-03-14T08:00:00.000Z',
    updated_at: NOW,
    canceled_at: null,
    cancellation_reason: null,
    ...overrides,
  } as PaymentIntent;
}

export function makeCharge(overrides: Partial<Charge> = {}): Charge {
  return {
    id: 'ch_01HW0RTCHARGE00000001',
    object: 'charge',
    merchant_id: MERCHANT_ID,
    payment_intent_id: 'pi_01HW0RTPAYMENTINTENT0001',
    amount_minor: 12_500,
    captured_amount_minor: 12_500,
    refunded_amount_minor: 0,
    currency: 'GBP',
    status: 'captured',
    card: {
      brand: 'visa',
      last_four: '4242',
      exp_month: 11,
      exp_year: 2029,
      country: 'GB',
      funding: 'credit',
    },
    acquirer: 'worldflow',
    network_transaction_id: 'ntx_88123',
    processor_reference: 'wf_ref_88123',
    authorization_code: 'A1B2C3',
    capture_method: 'manual',
    three_d_secure: null,
    sca_exemption: null,
    risk_score: 12,
    failure_code: null,
    failure_message: null,
    settlement_batch_id: 'sb_01HW0RTBATCH000000001',
    livemode: true,
    metadata: {},
    authorized_at: '2026-03-14T08:00:04.000Z',
    captured_at: '2026-03-14T08:02:00.000Z',
    settled_at: null,
    authorization_expires_at: '2026-03-21T08:00:04.000Z',
    created_at: '2026-03-14T08:00:00.000Z',
    updated_at: NOW,
    ...overrides,
  } as Charge;
}

export function makeRefund(overrides: Partial<Refund> = {}): Refund {
  return {
    id: 're_01HW0RTREFUND00000001',
    object: 'refund',
    merchant_id: MERCHANT_ID,
    charge_id: 'ch_01HW0RTCHARGE00000001',
    amount_minor: 2_500,
    currency: 'GBP',
    status: 'succeeded',
    reason: 'requested_by_customer',
    failure_reason: null,
    processor_reference: 'wf_ref_refund_1',
    metadata: {},
    created_at: '2026-03-14T09:00:00.000Z',
    succeeded_at: NOW,
    ...overrides,
  };
}

/** Wrap rows in the envelope every list route returns. */
export function makePage<T>(rows: ReadonlyArray<T>, hasMore = false): Paginated<T> {
  return {
    data: [...rows],
    next_cursor: hasMore ? 'cur_next_page_opaque' : null,
    has_more: hasMore,
  };
}

