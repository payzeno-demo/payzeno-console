/**
 * The deterministic demo dataset. Sales runs `?mock=1` (or `pnpm dev:mock`) on this.
 *
 * Everything here is fabricated but shaped exactly like the real thing: `Charge` carries a
 * nested `card`, `MerchantSettlementBatch` carries no acquirer totals, and one settlement
 * batch has `retryable` items so the retry button has something to do on stage.
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
  Payout,
  PaymentIntent,
  ReconciliationItem,
  Refund,
  SessionResponse,
  User,
  WebhookEndpoint,
  WebhookEvent,
} from '@payzeno/contracts';

import type { ConsoleNotification } from '@features/notifications/notification.types';

const NOW = '2026-01-15T09:40:00.000Z';
const MERCHANT_ID = 'mch_01HQ2DEMOMERCHANT01';

export const mockMerchant: Merchant = {
  id: MERCHANT_ID,
  object: 'merchant',
  legal_name: 'Northwind Trading Ltd',
  display_name: 'Northwind',
  country: 'GB',
  default_currency: 'GBP',
  status: 'active',
  mcc: '5691',
  risk_tier: 'standard',
  payout_schedule: 'daily',
  reserve_bps: 0,
  reserve_hold_days: 0,
  pricing_model: 'blended',
  platform_fee_bps: 145,
  platform_fee_fixed_minor: 20,
  payout_delay_days: 2,
  settlement_tolerance_minor: 50,
  capture_at_settlement: false,
  livemode: true,
  metadata: {},
  created_at: '2024-11-02T10:00:00.000Z',
  updated_at: NOW,
};

export const mockUser: User = {
  id: 'usr_01HQ2DEMOUSER0001',
  object: 'user',
  merchant_id: MERCHANT_ID,
  email: 'ops@northwind.example',
  full_name: 'Dana Okafor',
  role: 'admin',
  last_login_at: NOW,
  created_at: '2024-11-02T10:04:00.000Z',
};

export const mockSession: SessionResponse = {
  object: 'session',
  user: mockUser,
  merchant: mockMerchant,
  permissions: [
    'payments:read',
    'refunds:write',
    'payouts:write',
    'settlements:read',
    'api_keys:write',
    'team:write',
  ],
};

export const mockBalance: Balance = {
  object: 'balance',
  merchant_id: MERCHANT_ID,
  currency: 'GBP',
  available_minor: 4_182_340,
  pending_minor: 918_200,
  reserved_minor: 0,
  disputed_minor: 24_500,
  negative_balance_minor: 0,
  buckets: [
    { type: 'merchant_payable', amount_minor: 4_182_340 },
    { type: 'merchant_receivable', amount_minor: 918_200 },
  ],
  as_of: NOW,
};

function charge(index: number, overrides: Partial<Charge> = {}): Charge {
  const id = `ch_01HQ2DEMO${String(index).padStart(8, '0')}`;
  return {
    id,
    object: 'charge',
    merchant_id: MERCHANT_ID,
    payment_intent_id: `pi_01HQ2DEMO${String(index).padStart(8, '0')}`,
    amount_minor: 1200 + index * 785,
    captured_amount_minor: 1200 + index * 785,
    refunded_amount_minor: 0,
    currency: 'GBP',
    status: 'captured',
    card: {
      brand: index % 3 === 0 ? 'mastercard' : 'visa',
      last_four: String(4000 + index).slice(-4),
      exp_month: 1 + (index % 12),
      exp_year: 2029,
      country: 'GB',
      funding: index % 4 === 0 ? 'debit' : 'credit',
    },
    acquirer: index % 2 === 0 ? 'worldflow' : 'nordpay',
    network_transaction_id: `ntx_${index}_demo`,
    processor_reference: `wf_ref_${100000 + index}`,
    authorization_code: `A${10000 + index}`,
    capture_method: 'automatic',
    three_d_secure: null,
    sca_exemption: null,
    risk_score: 8 + (index % 20),
    failure_code: null,
    failure_message: null,
    settlement_batch_id: 'sb_01HQ2DEMOBATCH01',
    livemode: true,
    metadata: {},
    authorized_at: NOW,
    captured_at: NOW,
    settled_at: null,
    authorization_expires_at: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

export const mockCharges: Charge[] = [
  charge(1),
  charge(2),
  charge(3, { status: 'settled', settled_at: NOW }),
  charge(4, { status: 'failed', failure_code: 'do_not_honor', captured_amount_minor: 0 }),
  charge(5, { refunded_amount_minor: 500 }),
  charge(6),
  charge(7, { currency: 'JPY', amount_minor: 12_000, captured_amount_minor: 12_000 }),
  charge(8),
];

export const mockPaymentIntents: PaymentIntent[] = mockCharges.slice(0, 5).map((c, i) => ({
  id: c.payment_intent_id,
  object: 'payment_intent',
  merchant_id: MERCHANT_ID,
  amount_minor: c.amount_minor,
  currency: c.currency,
  status: i === 1 ? 'requires_capture' : 'succeeded',
  capture_method: i === 1 ? 'manual' : 'automatic',
  customer_reference: `cust-${1000 + i}`,
  description: 'Order from northwind.example',
  statement_descriptor: 'NORTHWIND',
  latest_charge_id: c.id,
  client_secret: `${c.payment_intent_id}_secret_demo`,
  next_action: null,
  livemode: true,
  metadata: {},
  created_at: NOW,
  updated_at: NOW,
  canceled_at: null,
  cancellation_reason: null,
}));

export const mockRefunds: Refund[] = [
  {
    id: 're_01HQ2DEMOREFUND01',
    object: 'refund',
    merchant_id: MERCHANT_ID,
    charge_id: mockCharges[4]!.id,
    amount_minor: 500,
    currency: 'GBP',
    status: 'succeeded',
    reason: 'requested_by_customer',
    failure_reason: null,
    processor_reference: 'wf_rfnd_9001',
    metadata: {},
    created_at: NOW,
    succeeded_at: NOW,
  },
];

export const mockDisputes: Dispute[] = [
  {
    id: 'dp_01HQ2DEMODISPUTE1',
    object: 'dispute',
    merchant_id: MERCHANT_ID,
    charge_id: mockCharges[0]!.id,
    amount_minor: 1985,
    fee_minor: 1500,
    currency: 'GBP',
    status: 'needs_response',
    reason: 'product_not_received',
    network_reason_code: '13.1',
    evidence_due_by: '2026-01-27T23:59:59.000Z',
    evidence: {},
    is_charge_refundable: false,
    liability_shifted: false,
    submitted_at: null,
    resolved_at: null,
    created_at: '2026-01-12T14:02:00.000Z',
  },
];

export const mockPayouts: Payout[] = [
  {
    id: 'po_01HQ2DEMOPAYOUT01',
    object: 'payout',
    merchant_id: MERCHANT_ID,
    bank_account_id: 'ba_01HQ2DEMOBANK0001',
    amount_minor: 3_182_340,
    currency: 'GBP',
    status: 'paid',
    method: 'faster_payments',
    available_on: '2026-01-13',
    arrival_estimate: '2026-01-13',
    statement_descriptor: 'PAYZENO PAYOUT',
    failure_code: null,
    ledger_transaction_id: 'txn_01HQ2DEMOTXN00001',
    reversal_transaction_id: null,
    livemode: true,
    initiated_at: '2026-01-13T06:00:00.000Z',
    paid_at: '2026-01-13T09:12:00.000Z',
    failed_at: null,
    returned_at: null,
    created_at: '2026-01-13T05:58:00.000Z',
  },
  {
    id: 'po_01HQ2DEMOPAYOUT02',
    object: 'payout',
    merchant_id: MERCHANT_ID,
    bank_account_id: 'ba_01HQ2DEMOBANK0001',
    amount_minor: 812_000,
    currency: 'GBP',
    status: 'failed',
    method: 'faster_payments',
    available_on: '2026-01-14',
    arrival_estimate: null,
    statement_descriptor: 'PAYZENO PAYOUT',
    failure_code: 'bank_rejected',
    ledger_transaction_id: 'txn_01HQ2DEMOTXN00002',
    reversal_transaction_id: 'txn_01HQ2DEMOTXN00003',
    livemode: true,
    initiated_at: '2026-01-14T06:00:00.000Z',
    paid_at: null,
    failed_at: '2026-01-14T11:41:00.000Z',
    returned_at: null,
    created_at: '2026-01-14T05:58:00.000Z',
  },
];

export const mockSettlements: MerchantSettlementBatch[] = [
  {
    id: 'sb_01HQ2DEMOBATCH01',
    object: 'merchant_settlement_batch',
    merchant_id: MERCHANT_ID,
    currency: 'GBP',
    processing_date: '2026-01-14',
    acquirer: 'worldflow',
    status: 'partially_reconciled',
    item_count: 6,
    net_minor: 288_140,
    funded_at: null,
  },
  {
    id: 'sb_01HQ2DEMOBATCH02',
    object: 'merchant_settlement_batch',
    merchant_id: MERCHANT_ID,
    currency: 'GBP',
    processing_date: '2026-01-13',
    acquirer: 'nordpay',
    status: 'funded',
    item_count: 11,
    net_minor: 934_610,
    funded_at: '2026-01-14T08:02:00.000Z',
  },
];

function item(index: number, overrides: Partial<ReconciliationItem> = {}): ReconciliationItem {
  return {
    id: `ri_01HQ2DEMOITEM${String(index).padStart(5, '0')}`,
    object: 'reconciliation_item',
    batch_id: 'sb_01HQ2DEMOBATCH01',
    charge_id: mockCharges[index % mockCharges.length]!.id,
    merchant_id: MERCHANT_ID,
    line_type: 'sale',
    gross_minor: 1200 + index * 785,
    fee_minor: 42 + index,
    interchange_minor: 28,
    scheme_fee_minor: 6,
    net_minor: 1158 + index * 785,
    expected_gross_minor: 1200 + index * 785,
    variance_minor: 0,
    currency: 'GBP',
    livemode: true,
    acquirer_reference: `wf_ref_${100000 + index}`,
    match_method: 'exact_reference',
    matched_at: NOW,
    status: 'settled',
    attempt_count: 1,
    last_error_code: null,
    last_attempt_at: NOW,
    next_attempt_at: NOW,
    settled_transaction_id: `txn_01HQ2DEMOSET${String(index).padStart(5, '0')}`,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

/** Two `retryable` rows so the demo's retry button has something real to press. */
export const mockSettlementItems: ReconciliationItem[] = [
  item(1),
  item(2),
  item(3, {
    status: 'retryable',
    attempt_count: 2,
    last_error_code: 'processor_unavailable',
    settled_transaction_id: null,
  }),
  item(4, {
    status: 'retryable',
    attempt_count: 4,
    last_error_code: 'processor_timeout',
    settled_transaction_id: null,
  }),
  item(5, { status: 'orphaned', charge_id: null, match_method: 'unmatched', matched_at: null }),
  item(6, { status: 'variance_exceeded', variance_minor: 220, expected_gross_minor: 5000 }),
];

export const mockInvoices: Invoice[] = [
  {
    id: 'inv_01HQ2DEMOINVOICE1',
    object: 'invoice',
    merchant_id: MERCHANT_ID,
    subscription_id: 'sub_demo_0001',
    number: 'PZ-2026-000418',
    status: 'open',
    currency: 'GBP',
    subtotal_minor: 49_900,
    tax_minor: 9_980,
    total_minor: 59_880,
    amount_paid_minor: 0,
    lines: [
      { description: 'Platform fee — December', quantity: 1, unit_amount_minor: 49_900, amount_minor: 49_900 },
    ],
    period_start: '2025-12-01',
    period_end: '2025-12-31',
    due_at: '2026-01-31T23:59:59.000Z',
    migrated_to_ledger: false,
    created_at: '2026-01-02T03:00:00.000Z',
  },
];

export const mockApiKeys: ApiKey[] = [
  {
    id: 'key_01HQ2DEMOKEY000001',
    object: 'api_key',
    merchant_id: MERCHANT_ID,
    name: 'Checkout server',
    mode: 'live',
    prefix: 'sk_live_',
    last_four: '9f21',
    scopes: ['payment_intents:write', 'charges:read', 'refunds:write'],
    created_at: '2025-03-14T12:00:00.000Z',
    revoked_at: null,
  },
];

export const mockBankAccounts: BankAccount[] = [
  {
    id: 'ba_01HQ2DEMOBANK0001',
    object: 'bank_account',
    merchant_id: MERCHANT_ID,
    country: 'GB',
    currency: 'GBP',
    bank_name: 'Metro Commercial',
    scheme: 'uk_sort_code',
    last_four: '4417',
    routing_last_four: null,
    iban_last_four: null,
    bic: 'METBGB2L',
    sort_code_last_four: '0912',
    status: 'validated',
    is_default: true,
    livemode: true,
    created_at: '2024-11-03T09:00:00.000Z',
  },
];

export const mockWebhookEndpoints: WebhookEndpoint[] = [
  {
    id: 'whe_01HQ2DEMOENDPOINT',
    object: 'webhook_endpoint',
    merchant_id: MERCHANT_ID,
    url: 'https://northwind.example/hooks/payzeno',
    enabled_events: ['payment.captured', 'refund.succeeded', 'payout.failed'],
    status: 'enabled',
    signing_secret_last_four: 'c41a',
    rotated_at: null,
    livemode: true,
    created_at: '2024-11-05T09:00:00.000Z',
  },
];

export const mockWebhookEvents: WebhookEvent[] = [
  {
    id: 'evt_01HQ2DEMOWEBHOOK1',
    object: 'webhook_event',
    merchant_id: MERCHANT_ID,
    endpoint_id: 'whe_01HQ2DEMOENDPOINT',
    type: 'payout.failed',
    source_event_id: 'evt_01HQ2DEMOBUS00001',
    payload: { payout_id: 'po_01HQ2DEMOPAYOUT02' },
    status: 'dead',
    attempt_count: 6,
    next_attempt_at: null,
    last_response_status: 500,
    last_error: 'upstream returned 500',
    signature_version: 'v1',
    livemode: true,
    created_at: '2026-01-14T11:41:20.000Z',
    delivered_at: null,
  },
];

export const mockDashboardSummary: DashboardSummary = {
  object: 'dashboard_summary',
  merchant_id: MERCHANT_ID,
  currency: 'GBP',
  window: '7d',
  gross_volume_minor: 8_412_900,
  net_volume_minor: 8_190_440,
  refunded_minor: 42_100,
  dispute_count: 1,
  succeeded_count: 1_284,
  failed_count: 37,
  next_payout: mockPayouts[0] ?? null,
  balance: mockBalance,
};

/** Replayed by `MockNotificationSocket`. `payout.failed` first — it is the loud one. */
export const mockNotifications: ConsoleNotification[] = [
  {
    id: 'ntf_01HQ2DEMONOTIF001',
    type: 'payout.failed',
    merchant_id: MERCHANT_ID,
    title: 'Payout failed',
    body: '£8,120.00 to Metro Commercial ••••4417 was rejected by the bank.',
    occurred_at: '2026-01-14T11:41:00.000Z',
    resource_id: 'po_01HQ2DEMOPAYOUT02',
  },
  {
    id: 'ntf_01HQ2DEMONOTIF002',
    type: 'settlement.completed',
    merchant_id: MERCHANT_ID,
    title: 'Settlement reconciled',
    body: 'Batch sb_01HQ2DEMOBATCH02 reconciled — 11 items settled.',
    occurred_at: '2026-01-14T08:02:00.000Z',
    resource_id: 'sb_01HQ2DEMOBATCH02',
  },
  {
    id: 'ntf_01HQ2DEMONOTIF003',
    type: 'dispute.opened',
    merchant_id: MERCHANT_ID,
    title: 'New dispute',
    body: 'A £19.85 charge was disputed as product_not_received.',
    occurred_at: '2026-01-12T14:02:00.000Z',
    resource_id: 'dp_01HQ2DEMODISPUTE1',
  },
];
