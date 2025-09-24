/**
 * List filters.
 *
 * Every filter state here **extends** the contracts `ListQuery` (or one of its per-resource
 * subtypes) so the object the UI holds is the object the endpoint takes, minus the pieces that
 * are pure UI. That is why there is no serialisation layer between `<FilterBar />` and the
 * query string.
 */
import type {
  ChargeListQuery,
  CurrencyCode,
  DisputeReason,
