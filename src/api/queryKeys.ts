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
