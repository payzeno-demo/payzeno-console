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
  CurrencyCode,
  Customer,
  DashboardSummary,
  Dispute,
  Invoice,
  KycDocument,
  Merchant,
  MerchantSettlementBatch,
  Onboarding,
  Payout,
  PaymentIntent,
  PaymentMethod,
  Price,
  ReconciliationItem,
  Refund,
  Review,
  SessionResponse,
  Subscription,
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
  /**
   * What payzeno-api sends an `admin` today (`auth.service.ts::PERMISSIONS_BY_ROLE`), in the
   * console's vocabulary. This list used to carry api scope names (`api_keys:write`,
   * `team:write`), so four of six entries were dropped by `toConsoleSession` and the demo
   * nav showed Payments, Charges, Refunds and Settlements and nothing else.
   */
  permissions: [
    'payments:read',
    'disputes:read',
    'balance:read',
    'payouts:read',
    'settlements:read',
    'invoices:read',
    'reporting:read',
    'settings:read',
    'payments:write',
    'refunds:write',
    'disputes:write',
    'payouts:write',
    'settlements:retry',
    'developers:read',
    'developers:write',
    'settings:write',
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

/**
 * RFC platform-v2 §7: balances are per currency. The demo merchant settles mostly in GBP, takes
 * some EUR through adaptive pricing and a little USD; ILS and JPY are empty.
 */
export const mockBalances: Readonly<Record<CurrencyCode, Balance>> = {
  GBP: mockBalance,
  EUR: {
    ...mockBalance,
    currency: 'EUR',
    available_minor: 182_440,
    pending_minor: 24_100,
    disputed_minor: 0,
    buckets: [
      { type: 'merchant_payable', amount_minor: 182_440 },
      { type: 'merchant_receivable', amount_minor: 24_100 },
    ],
  },
  USD: {
    ...mockBalance,
    currency: 'USD',
    available_minor: 51_200,
    pending_minor: 0,
    disputed_minor: 0,
    buckets: [{ type: 'merchant_payable', amount_minor: 51_200 }],
  },
  ILS: {
    ...mockBalance,
    currency: 'ILS',
    available_minor: 0,
    pending_minor: 0,
    disputed_minor: 0,
    buckets: [],
  },
  JPY: {
    ...mockBalance,
    currency: 'JPY',
    available_minor: 0,
    pending_minor: 0,
    disputed_minor: 0,
    buckets: [],
  },
};

export function mockBalanceFor(currency: string | undefined): Balance {
  switch (currency) {
    case 'EUR':
    case 'USD':
    case 'ILS':
    case 'JPY':
      return mockBalances[currency];
    default:
      return mockBalances.GBP;
  }
}

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
  // Held by platform risk rules: authorised, not captured, waiting on a Payzeno analyst.
  charge(6, {
    status: 'authorized',
    captured_amount_minor: 0,
    captured_at: null,
    risk_score: 71,
    authorization_expires_at: '2026-01-22T09:40:00.000Z',
  }),
  charge(7, { currency: 'JPY', amount_minor: 12_000, captured_amount_minor: 12_000 }),
  // Adaptive pricing (§7): priced at £16.99, paid in EUR at 1.1548.
  charge(8, {
    currency: 'EUR',
    amount_minor: 1_962,
    captured_amount_minor: 1_962,
    card: {
      brand: 'visa',
      last_four: '4008',
      exp_month: 9,
      exp_year: 2029,
      country: 'DE',
      funding: 'credit',
    },
  }),
];

const CUSTOMER_IDS = {
  amara: 'cus_01HQ2DEMOCUSTOMER01',
  liam: 'cus_01HQ2DEMOCUSTOMER02',
  noa: 'cus_01HQ2DEMOCUSTOMER03',
} as const;

const SUBSCRIPTION_IDS = {
  amara: 'csub_01HQ2DEMOSUBSCR001',
  liam: 'csub_01HQ2DEMOSUBSCR002',
  noa: 'csub_01HQ2DEMOSUBSCR003',
} as const;

const REVIEW_IDS = {
  open: 'rv_01HQ2DEMOREVIEW0001',
  approved: 'rv_01HQ2DEMOREVIEW0002',
} as const;

function paymentIntent(c: Charge, overrides: Partial<PaymentIntent> = {}): PaymentIntent {
  return {
    id: c.payment_intent_id,
    object: 'payment_intent',
    merchant_id: MERCHANT_ID,
    amount_minor: c.amount_minor,
    currency: c.currency,
    status: 'succeeded',
    capture_method: 'automatic',
    customer_reference: null,
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
    customer_id: null,
    payment_method_id: null,
    receipt_email: null,
    presentment: null,
    review_id: null,
    subscription_id: null,
    ...overrides,
  };
}

function chargeAt(index: number): Charge {
  const found = mockCharges[index];
  if (!found) throw new Error(`fixtures: no charge at ${index}`);
  return found;
}

export const mockPaymentIntents: PaymentIntent[] = [
  // A subscription renewal for a saved card.
  paymentIntent(chargeAt(0), {
    customer_reference: 'cust-1000',
    description: 'Northwind Coffee Club — January',
    customer_id: CUSTOMER_IDS.amara,
    payment_method_id: 'pm_01HQ2DEMOPMETHOD01',
    receipt_email: 'amara.osei@example.com',
    subscription_id: SUBSCRIPTION_IDS.amara,
  }),
  // Manual capture, so the capture button has something to do on stage.
  paymentIntent(chargeAt(1), {
    status: 'requires_capture',
    capture_method: 'manual',
    customer_reference: 'cust-1001',
  }),
  paymentIntent(chargeAt(2), { customer_reference: 'cust-1002' }),
  paymentIntent(chargeAt(3), { customer_reference: 'cust-1003' }),
  // Was held for review and approved by Payzeno risk.
  paymentIntent(chargeAt(4), {
    customer_reference: 'cust-1004',
    customer_id: CUSTOMER_IDS.liam,
    review_id: REVIEW_IDS.approved,
  }),
  // Held for review right now: `requires_capture` behind an open review, no capture button.
  paymentIntent(chargeAt(5), {
    status: 'requires_capture',
    customer_reference: 'cust-1005',
    customer_id: CUSTOMER_IDS.liam,
    receipt_email: 'liam.becker@example.de',
    review_id: REVIEW_IDS.open,
  }),
  // Adaptive pricing: the shopper paid in EUR.
  paymentIntent(chargeAt(7), {
    customer_reference: 'cust-1007',
    customer_id: CUSTOMER_IDS.noa,
    receipt_email: 'noa.levi@example.co.il',
    presentment: {
      original_amount_minor: 1_699,
      original_currency: 'GBP',
      fx_rate: '1.1548',
      fx_quote_id: 'fxq_01HQ2DEMOFXQUOTE01',
    },
  }),
];

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
    source_amount_minor: null,
    source_currency: null,
    fx_rate: null,
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
    source_amount_minor: null,
    source_currency: null,
    fx_rate: null,
  },
  // §7: £1,000.00 of GBP balance paid to the EUR account; the ledger converted at 1.1548.
  {
    id: 'po_01HQ2DEMOPAYOUT03',
    object: 'payout',
    merchant_id: MERCHANT_ID,
    bank_account_id: 'ba_01HQ2DEMOBANK0002',
    amount_minor: 115_480,
    currency: 'EUR',
    status: 'in_transit',
    method: 'sepa',
    available_on: '2026-01-15',
    arrival_estimate: '2026-01-16',
    statement_descriptor: 'PAYZENO PAYOUT',
    failure_code: null,
    ledger_transaction_id: 'txn_01HQ2DEMOTXN00004',
    reversal_transaction_id: null,
    livemode: true,
    initiated_at: '2026-01-15T06:00:00.000Z',
    paid_at: null,
    failed_at: null,
    returned_at: null,
    created_at: '2026-01-15T05:58:00.000Z',
    source_amount_minor: 100_000,
    source_currency: 'GBP',
    fx_rate: '1.1548',
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
  {
    id: 'ba_01HQ2DEMOBANK0002',
    object: 'bank_account',
    merchant_id: MERCHANT_ID,
    country: 'DE',
    currency: 'EUR',
    bank_name: 'Rheinland Handelsbank',
    scheme: 'iban',
    last_four: '3391',
    routing_last_four: null,
    iban_last_four: '3391',
    bic: 'RHHBDEFF',
    sort_code_last_four: null,
    status: 'validated',
    is_default: true,
    livemode: true,
    created_at: '2025-06-11T09:00:00.000Z',
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

// -- RFC platform-v2 -------------------------------------------------------------------------

export const mockCustomers: Customer[] = [
  {
    id: CUSTOMER_IDS.amara,
    object: 'customer',
    merchant_id: MERCHANT_ID,
    email: 'amara.osei@example.com',
    name: 'Amara Osei',
    default_payment_method_id: 'pm_01HQ2DEMOPMETHOD01',
    livemode: true,
    metadata: {},
    created_at: '2025-10-03T11:20:00.000Z',
  },
  {
    id: CUSTOMER_IDS.liam,
    object: 'customer',
    merchant_id: MERCHANT_ID,
    email: 'liam.becker@example.de',
    name: 'Liam Becker',
    default_payment_method_id: 'pm_01HQ2DEMOPMETHOD02',
    livemode: true,
    metadata: {},
    created_at: '2025-11-19T16:05:00.000Z',
  },
  {
    id: CUSTOMER_IDS.noa,
    object: 'customer',
    merchant_id: MERCHANT_ID,
    email: 'noa.levi@example.co.il',
    name: 'Noa Levi',
    default_payment_method_id: null,
    livemode: true,
    metadata: {},
    created_at: '2025-12-28T08:44:00.000Z',
  },
];

export const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'pm_01HQ2DEMOPMETHOD01',
    object: 'payment_method',
    customer_id: CUSTOMER_IDS.amara,
    card: { brand: 'visa', last_four: '4242', exp_month: 12, exp_year: 2028, country: 'GB', funding: 'credit' },
    livemode: true,
    created_at: '2025-10-03T11:21:00.000Z',
  },
  {
    id: 'pm_01HQ2DEMOPMETHOD03',
    object: 'payment_method',
    customer_id: CUSTOMER_IDS.amara,
    card: { brand: 'amex', last_four: '0005', exp_month: 3, exp_year: 2027, country: 'GB', funding: 'credit' },
    livemode: true,
    created_at: '2025-12-01T09:00:00.000Z',
  },
  {
    id: 'pm_01HQ2DEMOPMETHOD02',
    object: 'payment_method',
    customer_id: CUSTOMER_IDS.liam,
    card: { brand: 'mastercard', last_four: '5454', exp_month: 6, exp_year: 2027, country: 'DE', funding: 'debit' },
    livemode: true,
    created_at: '2025-11-19T16:06:00.000Z',
  },
];

export const mockPrices: Price[] = [
  {
    id: 'price_01HQ2DEMOPRICE0001',
    object: 'price',
    merchant_id: MERCHANT_ID,
    product_name: 'Northwind Coffee Club',
    unit_amount_minor: 1_500,
    currency: 'GBP',
    recurring: { interval: 'month', interval_count: 1 },
    active: true,
    livemode: true,
    metadata: {},
    created_at: '2025-09-01T10:00:00.000Z',
  },
  {
    id: 'price_01HQ2DEMOPRICE0002',
    object: 'price',
    merchant_id: MERCHANT_ID,
    product_name: 'Northwind Coffee Club — annual',
    unit_amount_minor: 15_000,
    currency: 'GBP',
    recurring: { interval: 'year', interval_count: 1 },
    active: true,
    livemode: true,
    metadata: {},
    created_at: '2025-09-01T10:05:00.000Z',
  },
  {
    id: 'price_01HQ2DEMOPRICE0003',
    object: 'price',
    merchant_id: MERCHANT_ID,
    product_name: 'Gift box',
    unit_amount_minor: 4_500,
    currency: 'GBP',
    recurring: null,
    active: true,
    livemode: true,
    metadata: {},
    created_at: '2025-11-20T14:00:00.000Z',
  },
];

export const mockSubscriptions: Subscription[] = [
  {
    id: SUBSCRIPTION_IDS.amara,
    object: 'subscription',
    merchant_id: MERCHANT_ID,
    customer_id: CUSTOMER_IDS.amara,
    price_id: 'price_01HQ2DEMOPRICE0001',
    status: 'active',
    current_period_start: '2026-01-03T11:20:00.000Z',
    current_period_end: '2026-02-03T11:20:00.000Z',
    cancel_at_period_end: false,
    canceled_at: null,
    default_payment_method_id: 'pm_01HQ2DEMOPMETHOD01',
    latest_payment_intent_id: mockPaymentIntents[0]?.id ?? null,
    next_retry_at: null,
    failed_attempts: 0,
    livemode: true,
    metadata: {},
    created_at: '2025-10-03T11:20:00.000Z',
  },
  {
    id: SUBSCRIPTION_IDS.liam,
    object: 'subscription',
    merchant_id: MERCHANT_ID,
    customer_id: CUSTOMER_IDS.liam,
    price_id: 'price_01HQ2DEMOPRICE0001',
    status: 'past_due',
    current_period_start: '2026-01-14T16:05:00.000Z',
    current_period_end: '2026-02-14T16:05:00.000Z',
    cancel_at_period_end: false,
    canceled_at: null,
    default_payment_method_id: 'pm_01HQ2DEMOPMETHOD02',
    latest_payment_intent_id: null,
    next_retry_at: '2026-01-17T16:05:00.000Z',
    failed_attempts: 1,
    livemode: true,
    metadata: {},
    created_at: '2025-11-19T16:05:00.000Z',
  },
  {
    id: SUBSCRIPTION_IDS.noa,
    object: 'subscription',
    merchant_id: MERCHANT_ID,
    customer_id: CUSTOMER_IDS.noa,
    price_id: 'price_01HQ2DEMOPRICE0002',
    status: 'canceled',
    current_period_start: '2025-12-28T08:44:00.000Z',
    current_period_end: '2026-12-28T08:44:00.000Z',
    cancel_at_period_end: false,
    canceled_at: '2026-01-10T10:00:00.000Z',
    default_payment_method_id: null,
    latest_payment_intent_id: null,
    next_retry_at: null,
    failed_attempts: 0,
    livemode: true,
    metadata: {},
    created_at: '2025-12-28T08:44:00.000Z',
  },
];

export const mockReviews: Review[] = [
  {
    id: REVIEW_IDS.open,
    object: 'review',
    merchant_id: MERCHANT_ID,
    payment_intent_id: chargeAt(5).payment_intent_id,
    charge_id: chargeAt(5).id,
    status: 'open',
    rules: ['country_mismatch', 'amount_spike'],
    risk_score: 71,
    amount_minor: chargeAt(5).amount_minor,
    currency: chargeAt(5).currency,
    ip_country: 'NG',
    card_country: 'GB',
    opened_at: NOW,
    closed_at: null,
    closed_by: null,
    note: null,
    livemode: true,
  },
  {
    id: REVIEW_IDS.approved,
    object: 'review',
    merchant_id: MERCHANT_ID,
    payment_intent_id: chargeAt(4).payment_intent_id,
    charge_id: chargeAt(4).id,
    status: 'approved',
    rules: ['card_velocity'],
    risk_score: 58,
    amount_minor: chargeAt(4).amount_minor,
    currency: chargeAt(4).currency,
    ip_country: 'GB',
    card_country: 'GB',
    opened_at: '2026-01-14T19:02:00.000Z',
    closed_at: '2026-01-14T19:40:00.000Z',
    closed_by: 'stf_01HQ2DEMOSTAFF0001',
    note: 'Repeat customer, matching billing address.',
    livemode: true,
  },
];

const mockKycDocuments: KycDocument[] = [
  {
    id: 'kyc_01HQ2DEMOKYCDOC0001',
    object: 'kyc_document',
    merchant_id: MERCHANT_ID,
    type: 'identity_document',
    filename: 'passport-dana-okafor.pdf',
    content_type: 'application/pdf',
    size_bytes: 284_211,
    uploaded_at: '2024-11-02T10:31:00.000Z',
  },
  {
    id: 'kyc_01HQ2DEMOKYCDOC0002',
    object: 'kyc_document',
    merchant_id: MERCHANT_ID,
    type: 'company_registration',
    filename: 'companies-house-certificate.pdf',
    content_type: 'application/pdf',
    size_bytes: 119_804,
    uploaded_at: '2024-11-02T10:33:00.000Z',
  },
];

/**
 * The demo merchant is `active`, so its onboarding is `approved`: the demo must not show a
 * state the api could not produce for this merchant.
 */
export const mockOnboarding: Onboarding = {
  object: 'onboarding',
  merchant_id: MERCHANT_ID,
  state: 'approved',
  business_profile: {
    business_type: 'company',
    website: 'https://northwind.example',
    product_description: 'Speciality coffee, subscriptions and brewing equipment.',
    support_email: 'help@northwind.example',
    address_line1: '12 Wharf Road',
    city: 'London',
    postal_code: 'N1 7GR',
    registration_number: '09876543',
  },
  representative: {
    full_name: 'Dana Okafor',
    date_of_birth: '1986-04-12',
    email: 'ops@northwind.example',
  },
  documents: mockKycDocuments,
  requirements_due: [],
  staff_message: null,
  submitted_at: '2024-11-02T10:40:00.000Z',
  decided_at: '2024-11-03T08:15:00.000Z',
};
