/**
 * The one query-key factory. Every `<f>.queries.ts` and every invalidation site imports it,
 * which makes this the highest in-degree module in the repo (~40 importers).
 *
 * Rule: a key is always an array whose first element is the resource name, so
 * `queryClient.invalidateQueries({ queryKey: queryKeys.settlements.all })` invalidates the
 * whole family. Never build a key inline in a feature.
 */
import type {
  ChargeListQuery,
  CurrencyCode,
  CustomerListQuery,
  ListQuery,
  PaymentIntentListQuery,
  ReportingWindow,
  ReviewListQuery,
  SubscriptionListQuery,
  TimeseriesInterval,
} from '@payzeno/contracts';

import type { DisputeListQuery } from './endpoints/disputes.endpoint';
import type { InvoiceListQuery } from './endpoints/invoices.endpoint';
import type { PayoutListQuery } from './endpoints/payouts.endpoint';
import type { RefundListQuery } from './endpoints/refunds.endpoint';
import type {
  SettlementItemListQuery,
  SettlementListQuery,
} from './endpoints/settlements.endpoint';
import type { WebhookEventListQuery } from './endpoints/webhook-events.endpoint';

/**
 * Stringified into the key so filters bust the cache. Each `list` below takes its route's own
 * `ListQuery` subtype: they are interfaces, so a `ListQuery & Record<string, unknown>`
 * catch-all rejects every one of them (an interface has no implicit index signature).
 */
function normalize(q?: ListQuery): Record<string, unknown> {
  if (!q) return {};
  const entries = Object.entries(q)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b));
  return Object.fromEntries(entries);
}

export const queryKeys = {
  session: {
    all: ['session'] as const,
    me: () => ['session', 'me'] as const,
  },

  paymentIntents: {
    all: ['payment_intents'] as const,
    list: (q?: PaymentIntentListQuery) => ['payment_intents', 'list', normalize(q)] as const,
    detail: (id: string) => ['payment_intents', 'detail', id] as const,
  },

  charges: {
    all: ['charges'] as const,
    list: (q?: ChargeListQuery) => ['charges', 'list', normalize(q)] as const,
    detail: (id: string) => ['charges', 'detail', id] as const,
    ledger: (id: string) => ['charges', 'ledger', id] as const,
  },

  refunds: {
    all: ['refunds'] as const,
    list: (q?: RefundListQuery) => ['refunds', 'list', normalize(q)] as const,
    detail: (id: string) => ['refunds', 'detail', id] as const,
  },

  disputes: {
    all: ['disputes'] as const,
    list: (q?: DisputeListQuery) => ['disputes', 'list', normalize(q)] as const,
    detail: (id: string) => ['disputes', 'detail', id] as const,
  },

  balance: {
    all: ['balance'] as const,
    current: (currency: CurrencyCode) => ['balance', 'current', currency] as const,
    /** RFC platform-v2 §7: every currency at once. Under `all`, so payouts invalidate it. */
    list: () => ['balance', 'list'] as const,
  },

  payouts: {
    all: ['payouts'] as const,
    list: (q?: PayoutListQuery) => ['payouts', 'list', normalize(q)] as const,
    detail: (id: string) => ['payouts', 'detail', id] as const,
  },

  settlements: {
    all: ['settlements'] as const,
    list: (q?: SettlementListQuery) => ['settlements', 'list', normalize(q)] as const,
    detail: (batchId: string) => ['settlements', 'detail', batchId] as const,
    items: (batchId: string, q?: SettlementItemListQuery) =>
      ['settlements', 'items', batchId, normalize(q)] as const,
    item: (batchId: string, itemId: string) =>
      ['settlements', 'items', batchId, 'item', itemId] as const,
  },

  invoices: {
    all: ['invoices'] as const,
    list: (q?: InvoiceListQuery) => ['invoices', 'list', normalize(q)] as const,
    detail: (id: string) => ['invoices', 'detail', id] as const,
  },

  apiKeys: {
    all: ['api_keys'] as const,
    list: () => ['api_keys', 'list'] as const,
    detail: (id: string) => ['api_keys', 'detail', id] as const,
  },

  webhookEvents: {
    all: ['webhook_events'] as const,
    list: (q?: WebhookEventListQuery) => ['webhook_events', 'list', normalize(q)] as const,
    detail: (id: string) => ['webhook_events', 'detail', id] as const,
  },

  webhookEndpoints: {
    all: ['webhook_endpoints'] as const,
    list: () => ['webhook_endpoints', 'list'] as const,
  },

  reporting: {
    all: ['reporting'] as const,
    summary: (window: ReportingWindow, currency: CurrencyCode) =>
      ['reporting', 'summary', window, currency] as const,
    volume: (interval: TimeseriesInterval, from: string, to: string, currency: CurrencyCode) =>
      ['reporting', 'volume', interval, from, to, currency] as const,
    balanceHistory: (
      interval: TimeseriesInterval,
      from: string,
      to: string,
      currency: CurrencyCode,
    ) => ['reporting', 'balance_history', interval, from, to, currency] as const,
  },

  bankAccounts: {
    all: ['bank_accounts'] as const,
    list: () => ['bank_accounts', 'list'] as const,
    detail: (id: string) => ['bank_accounts', 'detail', id] as const,
  },

  users: {
    all: ['users'] as const,
    list: (merchantId: string) => ['users', 'list', merchantId] as const,
  },

  // -- RFC platform-v2 -------------------------------------------------------------------

  /** A singleton per merchant. Submitting it also invalidates `session` (merchant status). */
  onboarding: {
    all: ['onboarding'] as const,
    current: () => ['onboarding', 'current'] as const,
  },

  customers: {
    all: ['customers'] as const,
    list: (q?: CustomerListQuery) => ['customers', 'list', normalize(q)] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
    paymentMethods: (id: string) => ['customers', 'payment_methods', id] as const,
  },

  prices: {
    all: ['prices'] as const,
    list: (q?: ListQuery) => ['prices', 'list', normalize(q)] as const,
    detail: (id: string) => ['prices', 'detail', id] as const,
  },

  subscriptions: {
    all: ['subscriptions'] as const,
    list: (q?: SubscriptionListQuery) => ['subscriptions', 'list', normalize(q)] as const,
    detail: (id: string) => ['subscriptions', 'detail', id] as const,
  },

  reviews: {
    all: ['reviews'] as const,
    list: (q?: ReviewListQuery) => ['reviews', 'list', normalize(q)] as const,
    detail: (id: string) => ['reviews', 'detail', id] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
