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
  ListQuery,
  PaymentIntentListQuery,
  ReportingWindow,
  TimeseriesInterval,
} from '@payzeno/contracts';

/** Anything a list route accepts. Stringified into the key so filters bust the cache. */
export type AnyListQuery = ListQuery & Record<string, unknown>;

function normalize(q?: AnyListQuery): Record<string, unknown> {
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
    list: (q?: AnyListQuery) => ['refunds', 'list', normalize(q)] as const,
    detail: (id: string) => ['refunds', 'detail', id] as const,
  },

  disputes: {
    all: ['disputes'] as const,
    list: (q?: AnyListQuery) => ['disputes', 'list', normalize(q)] as const,
    detail: (id: string) => ['disputes', 'detail', id] as const,
  },

  balance: {
    all: ['balance'] as const,
    current: (currency: CurrencyCode) => ['balance', 'current', currency] as const,
  },

  payouts: {
    all: ['payouts'] as const,
    list: (q?: AnyListQuery) => ['payouts', 'list', normalize(q)] as const,
    detail: (id: string) => ['payouts', 'detail', id] as const,
  },

  settlements: {
    all: ['settlements'] as const,
    list: (q?: AnyListQuery) => ['settlements', 'list', normalize(q)] as const,
    detail: (batchId: string) => ['settlements', 'detail', batchId] as const,
    items: (batchId: string, q?: AnyListQuery) =>
      ['settlements', 'items', batchId, normalize(q)] as const,
    item: (batchId: string, itemId: string) =>
      ['settlements', 'items', batchId, 'item', itemId] as const,
  },

  invoices: {
    all: ['invoices'] as const,
    list: (q?: AnyListQuery) => ['invoices', 'list', normalize(q)] as const,
    detail: (id: string) => ['invoices', 'detail', id] as const,
  },

  apiKeys: {
    all: ['api_keys'] as const,
    list: () => ['api_keys', 'list'] as const,
    detail: (id: string) => ['api_keys', 'detail', id] as const,
  },

  webhookEvents: {
    all: ['webhook_events'] as const,
    list: (q?: AnyListQuery) => ['webhook_events', 'list', normalize(q)] as const,
    detail: (id: string) => ['webhook_events', 'detail', id] as const,
