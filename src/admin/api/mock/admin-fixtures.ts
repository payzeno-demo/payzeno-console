/**
 * Admin fixtures — the data behind `AdminMockTransport` (`?mock=1` on the admin host) and the
 * admin MSW handlers (`src/admin/test/admin-handlers.ts`). One set, so the demo and the tests
 * cannot drift from each other, and every builder is typed against `@payzeno/contracts` (or a
 * local view type in `admin/types/`), so neither can drift from the api.
 *
 * Production code, like `api/mock/fixtures.ts`. Nothing here is a real person or a real company.
 */
import type {
  AdminMerchantDetail,
  AdminMerchantSummary,
  BankAccount,
  Balance,
  Dispute,
  EmailMessage,
  KycDocument,
  Merchant,
  Onboarding,
  ReconciliationItem,
  Review,
  StaffRole,
  StaffUser,
  SupportTask,
  User,
} from '@payzeno/contracts';

import type { AdminSettlementBacklog } from '../../types/settlement-backlog';

export const FIXTURE_NOW = '2026-10-29T09:00:00.000Z';

// ---------------------------------------------------------------------------------------------
// staff
// ---------------------------------------------------------------------------------------------

const STAFF_NAMES: Readonly<Record<StaffRole, { id: string; name: string }>> = {
  admin: { id: 'stf_01HZADMIN0000000000001', name: 'Avery Admin' },
  risk: { id: 'stf_01HZRISK00000000000001', name: 'Rina Risk' },
  finance: { id: 'stf_01HZFINANCE000000000001', name: 'Finn Finance' },
  support: { id: 'stf_01HZSUPPORT000000000001', name: 'Sam Support' },
};

export function makeStaffUser(role: StaffRole = 'admin', overrides: Partial<StaffUser> = {}): StaffUser {
  const who = STAFF_NAMES[role];
  return {
    id: who.id,
    object: 'staff_user',
    email: `${role}@staff.payzeno.example`,
    full_name: who.name,
    role,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------------------------
// merchants
// ---------------------------------------------------------------------------------------------

export const MOCK_MERCHANT_IDS = {
  northwind: 'mer_01HZADMNORTHWIND000001',
  lumen: 'mer_01HZADMLUMENPRINT00002',
  bramble: 'mer_01HZADMBRAMBLECAFE003',
  orbit: 'mer_01HZADMORBITGAMES0004',
  kestrel: 'mer_01HZADMKESTRELBIKES05',
} as const;

export function makeMerchant(overrides: Partial<Merchant> = {}): Merchant {
  return {
    id: MOCK_MERCHANT_IDS.northwind,
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
    capture_at_settlement: false,
    livemode: true,
    metadata: {},
    created_at: '2026-04-02T10:00:00.000Z',
    updated_at: '2026-10-01T10:00:00.000Z',
    ...overrides,
  };
}

export function makeKycDocument(overrides: Partial<KycDocument> = {}): KycDocument {
  return {
    id: 'kyc_01HZADMDOC000000000001',
    object: 'kyc_document',
    merchant_id: MOCK_MERCHANT_IDS.lumen,
    type: 'identity_document',
    filename: 'passport-scan.pdf',
    content_type: 'application/pdf',
    size_bytes: 284_113,
    uploaded_at: '2026-10-27T14:02:00.000Z',
    ...overrides,
  };
}

export function makeOnboarding(overrides: Partial<Onboarding> = {}): Onboarding {
  return {
    object: 'onboarding',
    merchant_id: MOCK_MERCHANT_IDS.northwind,
    state: 'approved',
    business_profile: {
      business_type: 'company',
      website: 'https://northwind.example',
      product_description: 'Specialty coffee beans and brewing equipment.',
      support_email: 'help@northwind.example',
      address_line1: '14 Harbour Row',
      city: 'Bristol',
      postal_code: 'BS1 4QA',
      registration_number: '09871234',
    },
    representative: {
      full_name: 'Dana Finance',
      date_of_birth: '1986-02-11',
      email: 'dana@northwind.example',
    },
    documents: [],
    requirements_due: [],
    staff_message: null,
    submitted_at: '2026-04-03T09:00:00.000Z',
    decided_at: '2026-04-04T11:00:00.000Z',
    ...overrides,
  };
}

export function makeMerchantUser(overrides: Partial<User> = {}): User {
  return {
    id: 'usr_01HZADMUSER00000000001',
    object: 'user',
    merchant_id: MOCK_MERCHANT_IDS.northwind,
    email: 'dana@northwind.example',
    full_name: 'Dana Finance',
    role: 'owner',
    last_login_at: '2026-10-28T08:12:00.000Z',
    created_at: '2026-04-02T10:05:00.000Z',
    ...overrides,
  };
}

export function makeBankAccount(overrides: Partial<BankAccount> = {}): BankAccount {
  return {
    id: 'ba_01HZADMBANKACCOUNT0001',
    object: 'bank_account',
    merchant_id: MOCK_MERCHANT_IDS.northwind,
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
    created_at: '2026-04-03T09:00:00.000Z',
    ...overrides,
  };
}

export function makeBalance(overrides: Partial<Balance> = {}): Balance {
  return {
    object: 'balance',
    merchant_id: MOCK_MERCHANT_IDS.northwind,
    currency: 'GBP',
    available_minor: 1_284_300,
    pending_minor: 412_050,
    reserved_minor: 0,
    disputed_minor: 12_500,
    negative_balance_minor: 0,
    buckets: [],
    as_of: FIXTURE_NOW,
    ...overrides,
  };
}

export function makeMerchantDetail(
  overrides: Partial<AdminMerchantDetail> = {},
): AdminMerchantDetail {
  const merchant = overrides.merchant ?? makeMerchant();
  return {
    object: 'admin_merchant',
    merchant,
    onboarding: makeOnboarding({ merchant_id: merchant.id }),
    users: [makeMerchantUser({ merchant_id: merchant.id })],
    ...overrides,
  };
}

/** The list row the api derives from a detail. */
export function summaryOf(detail: AdminMerchantDetail): AdminMerchantSummary {
  const owner = detail.users.find((user) => user.role === 'owner');
  return {
    object: 'admin_merchant_summary',
    merchant: detail.merchant,
    onboarding_state: detail.onboarding.state,
    submitted_at: detail.onboarding.submitted_at,
    owner_email: owner?.email ?? null,
  };
}

/** Five merchants, one per interesting onboarding / status combination. */
export function mockMerchantDetails(): AdminMerchantDetail[] {
  const lumen = makeMerchant({
    id: MOCK_MERCHANT_IDS.lumen,
    legal_name: 'Lumen Print Co. Ltd',
    display_name: 'Lumen Print',
    status: 'pending_review',
    mcc: '5111',
    created_at: '2026-10-25T16:20:00.000Z',
  });
  const bramble = makeMerchant({
    id: MOCK_MERCHANT_IDS.bramble,
    legal_name: 'Bramble Café SARL',
    display_name: 'Bramble Café',
    country: 'FR',
    default_currency: 'EUR',
    status: 'pending_review',
    mcc: '5812',
    created_at: '2026-10-20T08:00:00.000Z',
  });
  const orbit = makeMerchant({
    id: MOCK_MERCHANT_IDS.orbit,
    legal_name: 'Orbit Games Inc.',
    display_name: 'Orbit Games',
    country: 'US',
    default_currency: 'USD',
    status: 'restricted',
    mcc: '5816',
    risk_tier: 'elevated',
    created_at: '2026-06-11T12:00:00.000Z',
  });
  const kestrel = makeMerchant({
    id: MOCK_MERCHANT_IDS.kestrel,
    legal_name: 'Kestrel Bikes GmbH',
    display_name: 'Kestrel Bikes',
    country: 'DE',
    default_currency: 'EUR',
    status: 'pending_review',
    mcc: '5940',
    created_at: '2026-10-28T19:40:00.000Z',
  });

  return [
    makeMerchantDetail({
      bank_accounts: [makeBankAccount()],
      balances: [makeBalance()],
    }),
    makeMerchantDetail({
      merchant: lumen,
      onboarding: makeOnboarding({
        merchant_id: lumen.id,
        state: 'submitted',
        business_profile: {
          business_type: 'company',
          website: 'https://lumenprint.example',
          product_description: 'Short-run art prints and posters, shipped flat.',
          support_email: 'hello@lumenprint.example',
          address_line1: '3 Foundry Lane',
          city: 'Leeds',
          postal_code: 'LS1 2AB',
          registration_number: '13450021',
        },
        representative: {
          full_name: 'Priya Lumen',
          date_of_birth: '1990-07-30',
          email: 'priya@lumenprint.example',
        },
        documents: [
          makeKycDocument({ merchant_id: lumen.id }),
          makeKycDocument({
            id: 'kyc_01HZADMDOC000000000002',
            merchant_id: lumen.id,
            type: 'proof_of_address',
            filename: 'utility-bill-september.png',
            content_type: 'image/png',
            size_bytes: 412_908,
            uploaded_at: '2026-10-27T14:05:00.000Z',
          }),
          makeKycDocument({
            id: 'kyc_01HZADMDOC000000000003',
            merchant_id: lumen.id,
            type: 'company_registration',
            filename: 'certificate-of-incorporation.pdf',
            size_bytes: 98_221,
            uploaded_at: '2026-10-27T14:07:00.000Z',
          }),
        ],
        submitted_at: '2026-10-27T14:10:00.000Z',
        decided_at: null,
      }),
      users: [
        makeMerchantUser({
          id: 'usr_01HZADMUSER00000000002',
          merchant_id: lumen.id,
          email: 'priya@lumenprint.example',
          full_name: 'Priya Lumen',
          last_login_at: '2026-10-27T14:11:00.000Z',
          created_at: '2026-10-25T16:20:00.000Z',
        }),
      ],
      bank_accounts: [
        makeBankAccount({
          id: 'ba_01HZADMBANKACCOUNT0002',
          merchant_id: lumen.id,
          bank_name: 'Pennine Mutual',
          last_four: '4410',
          sort_code_last_four: '2291',
          status: 'new',
          created_at: '2026-10-26T10:00:00.000Z',
        }),
      ],
    }),
    makeMerchantDetail({
      merchant: bramble,
      onboarding: makeOnboarding({
        merchant_id: bramble.id,
        state: 'needs_info',
        business_profile: {
          business_type: 'company',
          website: 'https://bramble-cafe.example',
          product_description: 'Café and bakery, takeaway orders online.',
          support_email: 'bonjour@bramble-cafe.example',
          address_line1: '22 Rue des Lilas',
          city: 'Lyon',
          postal_code: '69003',
          registration_number: 'FR40123456789',
        },
        representative: {
          full_name: 'Camille Bramble',
          date_of_birth: '1984-12-03',
          email: 'camille@bramble-cafe.example',
        },
        documents: [
          makeKycDocument({
            id: 'kyc_01HZADMDOC000000000004',
            merchant_id: bramble.id,
            filename: 'carte-identite.jpg',
            content_type: 'image/jpeg',
            size_bytes: 188_004,
            uploaded_at: '2026-10-21T09:30:00.000Z',
          }),
        ],
        requirements_due: ['bank_account'],
        staff_message: 'Please add a bank account in the business name before we can review.',
        submitted_at: '2026-10-21T09:31:00.000Z',
        decided_at: '2026-10-22T10:00:00.000Z',
      }),
      users: [
        makeMerchantUser({
          id: 'usr_01HZADMUSER00000000003',
          merchant_id: bramble.id,
          email: 'camille@bramble-cafe.example',
          full_name: 'Camille Bramble',
          last_login_at: '2026-10-22T18:00:00.000Z',
          created_at: '2026-10-20T08:00:00.000Z',
        }),
      ],
      bank_accounts: [],
    }),
    makeMerchantDetail({
      merchant: orbit,
      onboarding: makeOnboarding({ merchant_id: orbit.id }),
      users: [
        makeMerchantUser({
          id: 'usr_01HZADMUSER00000000004',
          merchant_id: orbit.id,
          email: 'ops@orbitgames.example',
          full_name: 'Morgan Orbit',
          created_at: '2026-06-11T12:00:00.000Z',
        }),
        makeMerchantUser({
          id: 'usr_01HZADMUSER00000000005',
          merchant_id: orbit.id,
          email: 'dev@orbitgames.example',
          full_name: 'Jules Dev',
          role: 'developer',
          last_login_at: null,
          created_at: '2026-06-12T12:00:00.000Z',
        }),
      ],
    }),
    makeMerchantDetail({
      merchant: kestrel,
      onboarding: makeOnboarding({
        merchant_id: kestrel.id,
        state: 'collecting',
        business_profile: {
          business_type: null,
          website: null,
          product_description: null,
          support_email: null,
          address_line1: null,
          city: null,
          postal_code: null,
          registration_number: null,
        },
        representative: { full_name: null, date_of_birth: null, email: null },
        requirements_due: ['business_profile', 'representative', 'bank_account', 'identity_document'],
        submitted_at: null,
        decided_at: null,
      }),
      users: [
        makeMerchantUser({
          id: 'usr_01HZADMUSER00000000006',
          merchant_id: kestrel.id,
          email: 'lena@kestrelbikes.example',
          full_name: 'Lena Kestrel',
          created_at: '2026-10-28T19:40:00.000Z',
        }),
      ],
    }),
  ];
}

// ---------------------------------------------------------------------------------------------
// risk reviews
// ---------------------------------------------------------------------------------------------

export function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 'rv_01HZADMREVIEW0000000001',
    object: 'review',
    merchant_id: MOCK_MERCHANT_IDS.northwind,
    payment_intent_id: 'pi_01HZADMPAYMENT000000001',
    charge_id: 'ch_01HZADMCHARGE0000000001',
    status: 'open',
    rules: ['country_mismatch', 'high_acquirer_score'],
    risk_score: 78,
    amount_minor: 48_900,
    currency: 'GBP',
    ip_country: 'NG',
    card_country: 'GB',
    opened_at: '2026-10-29T07:41:00.000Z',
    closed_at: null,
    closed_by: null,
    note: null,
    livemode: true,
    ...overrides,
  };
}

export function mockReviews(): Review[] {
  return [
    makeReview(),
    makeReview({
      id: 'rv_01HZADMREVIEW0000000002',
      merchant_id: MOCK_MERCHANT_IDS.orbit,
      payment_intent_id: 'pi_01HZADMPAYMENT000000002',
      charge_id: 'ch_01HZADMCHARGE0000000002',
      rules: ['card_velocity', 'ip_velocity'],
      risk_score: 64,
      amount_minor: 9_999,
      currency: 'USD',
      ip_country: 'US',
      card_country: 'US',
      opened_at: '2026-10-29T08:02:00.000Z',
    }),
    makeReview({
      id: 'rv_01HZADMREVIEW0000000003',
      merchant_id: MOCK_MERCHANT_IDS.northwind,
      payment_intent_id: 'pi_01HZADMPAYMENT000000003',
      charge_id: 'ch_01HZADMCHARGE0000000003',
      rules: ['amount_spike', 'very_high_acquirer_score'],
      risk_score: 91,
      amount_minor: 650_000,
      ip_country: null,
      card_country: 'IE',
      opened_at: '2026-10-29T08:30:00.000Z',
    }),
    makeReview({
      id: 'rv_01HZADMREVIEW0000000004',
      status: 'approved',
      payment_intent_id: 'pi_01HZADMPAYMENT000000004',
      charge_id: 'ch_01HZADMCHARGE0000000004',
      rules: ['new_merchant_large_amount'],
      risk_score: 55,
      ip_country: 'GB',
      opened_at: '2026-10-28T13:00:00.000Z',
      closed_at: '2026-10-28T13:20:00.000Z',
      closed_by: STAFF_NAMES.risk.id,
      note: 'Repeat customer, confirmed by phone.',
    }),
  ];
}

// ---------------------------------------------------------------------------------------------
// disputes
// ---------------------------------------------------------------------------------------------

export function makeAdminDispute(overrides: Partial<Dispute> = {}): Dispute {
  return {
    id: 'dp_01HZADMDISPUTE000000001',
    object: 'dispute',
    merchant_id: MOCK_MERCHANT_IDS.northwind,
    charge_id: 'ch_01HZADMCHARGE0000000011',
    amount_minor: 12_500,
    fee_minor: 1_500,
    currency: 'GBP',
    status: 'needs_response',
    reason: 'fraudulent',
    network_reason_code: '10.4',
    evidence_due_by: '2026-11-05T23:59:59.000Z',
    evidence: {},
    is_charge_refundable: false,
    liability_shifted: false,
    submitted_at: null,
    resolved_at: null,
    created_at: '2026-10-26T11:00:00.000Z',
    ...overrides,
  };
}

export function mockDisputes(): Dispute[] {
  return [
    makeAdminDispute(),
    makeAdminDispute({
      id: 'dp_01HZADMDISPUTE000000002',
      merchant_id: MOCK_MERCHANT_IDS.orbit,
      charge_id: 'ch_01HZADMCHARGE0000000012',
      amount_minor: 5_999,
      currency: 'USD',
      reason: 'product_not_received',
      network_reason_code: '13.1',
      evidence_due_by: '2026-11-01T23:59:59.000Z',
      created_at: '2026-10-24T09:00:00.000Z',
    }),
    makeAdminDispute({
      id: 'dp_01HZADMDISPUTE000000003',
      charge_id: 'ch_01HZADMCHARGE0000000013',
      status: 'under_review',
      reason: 'duplicate',
      network_reason_code: '12.6.1',
      submitted_at: '2026-10-20T10:00:00.000Z',
      created_at: '2026-10-15T09:00:00.000Z',
    }),
    makeAdminDispute({
      id: 'dp_01HZADMDISPUTE000000004',
      merchant_id: MOCK_MERCHANT_IDS.orbit,
      charge_id: 'ch_01HZADMCHARGE0000000014',
      amount_minor: 2_000,
      currency: 'USD',
      status: 'lost',
      reason: 'general',
      evidence_due_by: null,
      resolved_at: '2026-10-10T09:00:00.000Z',
      created_at: '2026-09-28T09:00:00.000Z',
    }),
  ];
}

// ---------------------------------------------------------------------------------------------
// settlements
// ---------------------------------------------------------------------------------------------

export function makeBacklogItem(overrides: Partial<ReconciliationItem> = {}): ReconciliationItem {
  return {
    id: 'ri_01HZADMITEM00000000001',
    object: 'reconciliation_item',
    batch_id: 'sb_01HZADMBATCH000000001',
    charge_id: 'ch_01HZADMCHARGE0000000021',
    merchant_id: MOCK_MERCHANT_IDS.northwind,
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
    acquirer_reference: 'wf_ref_99120',
    match_method: 'exact_reference',
    matched_at: '2026-10-29T02:00:00.000Z',
    status: 'retryable',
    attempt_count: 2,
    last_error_code: 'ledger_unavailable',
    last_attempt_at: '2026-10-29T02:30:00.000Z',
    next_attempt_at: '2026-10-29T03:00:00.000Z',
    settled_transaction_id: null,
    created_at: '2026-10-29T01:00:00.000Z',
    updated_at: '2026-10-29T02:30:00.000Z',
    ...overrides,
  };
}

export function mockBacklog(): AdminSettlementBacklog {
  const items = [
    makeBacklogItem(),
    makeBacklogItem({
      id: 'ri_01HZADMITEM00000000002',
      charge_id: 'ch_01HZADMCHARGE0000000022',
      gross_minor: 48_000,
      net_minor: 47_100,
      attempt_count: 5,
    }),
    makeBacklogItem({
      id: 'ri_01HZADMITEM00000000003',
      batch_id: 'sb_01HZADMBATCH000000002',
      charge_id: null,
      merchant_id: null,
      line_type: 'adjustment',
      gross_minor: -1_200,
      net_minor: -1_200,
      expected_gross_minor: null,
      match_method: 'unmatched',
      matched_at: null,
      status: 'orphaned',
      attempt_count: 0,
      last_error_code: null,
      last_attempt_at: null,
      currency: 'EUR',
    }),
  ];
  return {
    object: 'reconciliation_backlog',
    retryable: 2,
    failed: 0,
    orphaned: 1,
    needs_review: 0,
    variance_exceeded: 0,
    oldest_retryable_at: '2026-10-29T03:00:00.000Z',
    buckets: [
      {
        batch_id: 'sb_01HZADMBATCH000000001',
        currency: 'GBP',
        status: 'retryable',
        item_count: 2,
        gross_minor: 60_500,
        oldest_next_attempt_at: '2026-10-29T03:00:00.000Z',
      },
      {
        batch_id: 'sb_01HZADMBATCH000000002',
        currency: 'EUR',
        status: 'orphaned',
        item_count: 1,
        gross_minor: -1_200,
        oldest_next_attempt_at: null,
      },
    ],
    items,
  };
}

// ---------------------------------------------------------------------------------------------
// support
// ---------------------------------------------------------------------------------------------

export function makeSupportTask(overrides: Partial<SupportTask> = {}): SupportTask {
  return {
    id: 'sup_01HZADMTASK00000000001',
    object: 'support_task',
    merchant_id: MOCK_MERCHANT_IDS.northwind,
    kind: 'duplicate_settlement',
    severity: 'high',
    status: 'open',
    charge_id: 'ch_01HZADMCHARGE0000000021',
    title: 'Possible double capture on a capture-at-settlement charge',
    body: 'Duplicate settlement line for ch_01HZADMCHARGE0000000021 on a capture-at-settlement merchant. Check the acquirer portal for a second capture before refunding.',
    livemode: true,
    assigned_to: null,
    resolved_at: null,
    resolution_note: null,
    created_at: '2026-10-29T02:31:00.000Z',
    ...overrides,
  };
}

export function mockSupportTasks(): SupportTask[] {
  return [
    makeSupportTask(),
    makeSupportTask({
      id: 'sup_01HZADMTASK00000000002',
      merchant_id: MOCK_MERCHANT_IDS.orbit,
      kind: 'payout_returned',
      severity: 'normal',
      charge_id: null,
      title: 'Payout returned by the receiving bank (account closed)',
      created_at: '2026-10-28T16:00:00.000Z',
    }),
    makeSupportTask({
      id: 'sup_01HZADMTASK00000000003',
      merchant_id: MOCK_MERCHANT_IDS.bramble,
      kind: 'manual_review',
      severity: 'low',
      status: 'acknowledged',
      charge_id: null,
      title: 'Merchant asked why onboarding is paused',
      created_at: '2026-10-23T10:00:00.000Z',
    }),
    makeSupportTask({
      id: 'sup_01HZADMTASK00000000004',
      kind: 'ledger_imbalance',
      severity: 'critical',
      status: 'resolved',
      charge_id: null,
      title: 'Trial balance off by 1 minor unit (GBP)',
      created_at: '2026-10-12T03:00:00.000Z',
      resolved_at: '2026-10-12T05:00:00.000Z',
      resolution_note: 'Rounding adjustment posted.',
    }),
  ];
}

// ---------------------------------------------------------------------------------------------
// email
// ---------------------------------------------------------------------------------------------

export function makeEmail(overrides: Partial<EmailMessage> = {}): EmailMessage {
  return {
    id: 'em_01HZADMEMAIL0000000001',
    object: 'email_message',
    template: 'signup_verify',
    to: 'priya@lumenprint.example',
    subject: 'Verify your email for Payzeno',
    status: 'sent',
    merchant_id: MOCK_MERCHANT_IDS.lumen,
    created_at: '2026-10-25T16:20:05.000Z',
    sent_at: '2026-10-25T16:20:09.000Z',
    ...overrides,
  };
}

export function mockEmails(): EmailMessage[] {
  return [
    makeEmail(),
    makeEmail({
      id: 'em_01HZADMEMAIL0000000002',
      template: 'onboarding_info_requested',
      to: 'camille@bramble-cafe.example',
      subject: 'We need a little more information',
      merchant_id: MOCK_MERCHANT_IDS.bramble,
      created_at: '2026-10-22T10:00:02.000Z',
      sent_at: '2026-10-22T10:00:06.000Z',
    }),
    makeEmail({
      id: 'em_01HZADMEMAIL0000000003',
      template: 'payout_failed',
      to: 'ops@orbitgames.example',
      subject: 'A payout to your bank account failed',
      status: 'failed',
      merchant_id: MOCK_MERCHANT_IDS.orbit,
      created_at: '2026-10-28T16:00:03.000Z',
      sent_at: null,
    }),
  ];
}
