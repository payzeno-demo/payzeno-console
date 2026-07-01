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
export const MERCHANT_ID = 'mch_01HW0RTHERMOSPHERE0001';
export const USER_ID = 'usr_01HW0RTHERMOSPHERE0002';

export function makeMerchant(overrides: Partial<Merchant> = {}): Merchant {
  return {
    id: MERCHANT_ID,
    object: 'merchant',
    legal_name: 'Northwind Trading Ltd',
    display_name: 'Northwind',
    country: 'GB',
    default_currency: 'GBP',
    status: 'active',
    mcc: '5814',
    risk_tier: 'standard',
    payout_schedule: 'daily',
    reserve_bps: 0,
    reserve_hold_days: 0,
    pricing_model: 'blended',
    platform_fee_bps: 175,
    platform_fee_fixed_minor: 20,
    payout_delay_days: 2,
    settlement_tolerance_minor: 50,
    livemode: true,
    created_at: '2025-04-02T10:00:00.000Z',
    ...overrides,
  } as Merchant;
}

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

/** A session with a narrow role, for `usePermissions` and `RequireRole` assertions. */
export function makeViewerSession(): ConsoleSession {
  return toConsoleSession(
    makeSession({ user: makeUser({ role: 'viewer' }), permissions: [] }),
  );
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

export function makeDispute(overrides: Partial<Dispute> = {}): Dispute {
  return {
    id: 'dp_01HW0RTDISPUTE00000001',
    object: 'dispute',
    merchant_id: MERCHANT_ID,
    charge_id: 'ch_01HW0RTCHARGE00000001',
    amount_minor: 12_500,
    fee_minor: 1_500,
    currency: 'GBP',
    status: 'needs_response',
    reason: 'fraudulent',
    network_reason_code: '10.4',
    evidence_due_by: '2026-03-21T23:59:59.000Z',
    evidence: {},
    is_charge_refundable: false,
    liability_shifted: false,
    submitted_at: null,
    resolved_at: null,
    created_at: '2026-03-13T11:00:00.000Z',
    ...overrides,
  };
}

export function makeBalance(overrides: Partial<Balance> = {}): Balance {
  return {
    object: 'balance',
    merchant_id: MERCHANT_ID,
    currency: 'GBP',
    available_minor: 1_284_300,
    pending_minor: 412_050,
    reserved_minor: 0,
    disputed_minor: 12_500,
    negative_balance_minor: 0,
    buckets: [
      { type: 'merchant_payable', amount_minor: 1_284_300 },
      { type: 'merchant_receivable', amount_minor: 412_050 },
      { type: 'chargeback_liability', amount_minor: 12_500 },
    ],
    as_of: NOW,
    ...overrides,
  };
}

export function makePayout(overrides: Partial<Payout> = {}): Payout {
  return {
    id: 'po_01HW0RTPAYOUT00000001',
    object: 'payout',
    merchant_id: MERCHANT_ID,
    bank_account_id: 'ba_01HW0RTBANKACCOUNT0001',
    amount_minor: 984_300,
    currency: 'GBP',
    status: 'in_transit',
    method: 'standard',
    available_on: TODAY,
    arrival_estimate: '2026-03-16',
    statement_descriptor: 'PAYZENO PAYOUT',
    failure_code: null,
    ledger_transaction_id: 'txn_01HW0RTLEDGERTXN000001',
    reversal_transaction_id: null,
    livemode: true,
    initiated_at: '2026-03-14T06:00:00.000Z',
    paid_at: null,
    failed_at: null,
    returned_at: null,
    created_at: '2026-03-14T05:00:00.000Z',
    ...overrides,
  } as Payout;
}

export function makeSettlementBatch(
  overrides: Partial<MerchantSettlementBatch> = {},
): MerchantSettlementBatch {
  return {
    id: 'sb_01HW0RTBATCH000000001',
    object: 'merchant_settlement_batch',
    merchant_id: MERCHANT_ID,
    currency: 'GBP',
    processing_date: '2026-03-13',
    acquirer: 'worldflow',
    status: 'partially_reconciled',
    item_count: 3,
    net_minor: 36_120,
    funded_at: null,
    ...overrides,
  };
}

/**
 * A reconciliation item. `attempt_count` defaults to 1 so that
 * `useSettlementItems::_isDuplicateSuspect` is false unless a test asks for the arc-INC
 * fingerprint — a settled item that took more than one attempt.
 */
export function makeReconciliationItem(
  overrides: Partial<ReconciliationItem> = {},
): ReconciliationItem {
  return {
    id: 'ri_01HW0RTITEM00000000001',
    object: 'reconciliation_item',
    batch_id: 'sb_01HW0RTBATCH000000001',
    charge_id: 'ch_01HW0RTCHARGE00000001',
    merchant_id: MERCHANT_ID,
    line_type: 'sale',
    gross_minor: 12_500,
    fee_minor: 240,
    interchange_minor: 150,
    scheme_fee_minor: 30,
    net_minor: 12_260,
    expected_gross_minor: 12_500,
    variance_minor: 0,
    currency: 'GBP',
    livemode: true,
    acquirer_reference: 'wf_ref_88123',
    match_method: 'exact_reference',
    matched_at: '2026-03-14T02:00:00.000Z',
    status: 'retryable',
    attempt_count: 1,
    last_error_code: 'ledger_unavailable',
    last_attempt_at: '2026-03-14T02:30:00.000Z',
    next_attempt_at: '2026-03-14T03:00:00.000Z',
    settled_transaction_id: null,
    created_at: '2026-03-14T01:00:00.000Z',
    updated_at: NOW,
    ...overrides,
  } as ReconciliationItem;
}

export function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 'inv_01HW0RTINVOICE00000001',
    object: 'invoice',
    merchant_id: MERCHANT_ID,
    subscription_id: null,
    number: 'PZ-2026-000412',
    status: 'open',
    currency: 'GBP',
    subtotal_minor: 41_200,
    tax_minor: 8_240,
    total_minor: 49_440,
    amount_paid_minor: 0,
    lines: [
      {
        description: 'Processing fees, February 2026',
        quantity: 1,
        unit_amount_minor: 41_200,
        amount_minor: 41_200,
      },
    ],
    period_start: '2026-02-01',
    period_end: '2026-02-28',
    due_at: '2026-03-31T23:59:59.000Z',
    migrated_to_ledger: false,
    created_at: '2026-03-01T00:05:00.000Z',
    ...overrides,
  };
}

export function makeBankAccount(overrides: Partial<BankAccount> = {}): BankAccount {
  return {
    id: 'ba_01HW0RTBANKACCOUNT0001',
    object: 'bank_account',
    merchant_id: MERCHANT_ID,
    country: 'GB',
    currency: 'GBP',
    bank_name: 'Northern Counties Bank',
    scheme: 'uk_sort_code',
    last_four: '8812',
    routing_last_four: null,
    iban_last_four: null,
    bic: 'NCBKGB2L',
    sort_code_last_four: '0417',
    status: 'validated',
    is_default: true,
    livemode: true,
    created_at: '2025-04-03T09:00:00.000Z',
    ...overrides,
  };
}

export function makeWebhookEndpoint(
  overrides: Partial<WebhookEndpoint> = {},
): WebhookEndpoint {
  return {
    id: 'whe_01HW0RTENDPOINT0000001',
    object: 'webhook_endpoint',
    merchant_id: MERCHANT_ID,
    url: 'https://northwind.example/hooks/payzeno',
    enabled_events: ['payment.captured', 'payout.failed', 'dispute.opened'],
    status: 'enabled',
    signing_secret_last_four: '41ab',
    rotated_at: null,
    livemode: true,
    created_at: '2025-04-04T09:00:00.000Z',
    ...overrides,
  };
}

export function makeWebhookEvent(overrides: Partial<WebhookEvent> = {}): WebhookEvent {
  return {
    id: 'evt_01HW0RTWEBHOOKEVENT001',
    object: 'webhook_event',
    merchant_id: MERCHANT_ID,
    endpoint_id: 'whe_01HW0RTENDPOINT0000001',
    type: 'payment.captured',
    source_event_id: 'bus_01HW0RTBUSEVENT000001',
    payload: { object: 'charge', id: 'ch_01HW0RTCHARGE00000001' },
    status: 'delivered',
    attempt_count: 1,
    next_attempt_at: null,
    last_response_status: 200,
    last_error: null,
    signature_version: 'v1',
    livemode: true,
    created_at: '2026-03-14T08:02:01.000Z',
    delivered_at: '2026-03-14T08:02:02.000Z',
    ...overrides,
  };
}

export function makeDashboardSummary(
  overrides: Partial<DashboardSummary> = {},
): DashboardSummary {
  return {
    object: 'dashboard_summary',
    merchant_id: MERCHANT_ID,
    currency: 'GBP',
    window: '7d',
    gross_volume_minor: 4_812_400,
    net_volume_minor: 4_612_900,
    refunded_minor: 128_000,
    dispute_count: 2,
    succeeded_count: 412,
    failed_count: 18,
    next_payout: makePayout({ status: 'scheduled' }),
    balance: makeBalance(),
    ...overrides,
  };
}

export function makeNotification(
  overrides: Partial<ConsoleNotification> = {},
): ConsoleNotification {
  return {
    id: 'ntf_01HW0RTNOTIFICATION001',
    type: 'payout.failed',
    merchant_id: MERCHANT_ID,
    title: 'Payout failed',
    body: 'Your £9,843.00 payout was rejected by the bank.',
    occurred_at: NOW,
    resource_id: 'po_01HW0RTPAYOUT00000001',
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

/** The error envelope payzeno-api returns on every non-2xx. */
export function makeApiErrorBody(
  code: string,
  message: string,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    error: {
      code,
      message,
      request_id: 'req_01HW0RTREQUEST0000001',
      ...extra,
    },
  };
}
