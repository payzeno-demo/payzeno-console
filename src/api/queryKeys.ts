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
