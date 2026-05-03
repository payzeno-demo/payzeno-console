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
  DisputeStatus,
  ListQuery,
  PaymentIntentListQuery,
  PayoutStatus,
  ReconciliationItemStatus,
  RefundStatus,
  SettlementBatchStatus,
} from '@payzeno/contracts';

/** Bits every filter bar has, that never reach the API. */
export interface UiFilterState {
  /** Free-text box contents. Debounced; resolved client-side against ids. */
  search: string;
}

export interface PaymentFilters extends PaymentIntentListQuery, UiFilterState {}

export interface ChargeFilters extends ChargeListQuery, UiFilterState {
  currency?: CurrencyCode;
}

export interface RefundFilters extends ListQuery, UiFilterState {
  status?: RefundStatus;
}

export interface DisputeFilters extends ListQuery, UiFilterState {
  status?: DisputeStatus;
  reason?: DisputeReason;
  /** UI-only shortcut for "evidence due in the next 72 hours". */
  dueSoon?: boolean;
}

export interface PayoutFilters extends ListQuery, UiFilterState {
  status?: PayoutStatus;
  currency?: CurrencyCode;
}

export interface SettlementFilters extends ListQuery, UiFilterState {
  status?: SettlementBatchStatus;
  currency?: CurrencyCode;
}

export interface SettlementItemFilters extends ListQuery {
  status?: ReconciliationItemStatus;
  /** arc INC — "show me only the items the duplicate sweep flagged". */
  duplicatesOnly?: boolean;
}

/** Keys that are UI-only and must be stripped before the object becomes a request. */
const UI_ONLY_KEYS: ReadonlyArray<string> = ['search', 'dueSoon', 'duplicatesOnly'];

/**
 * Drop UI-only keys and anything undefined/empty.
 *
 * Sending `status=` to the API is not the same as omitting it — the former is a validation
 * error on some routes and an empty result on others.
 */
export function toRequestQuery<TFilters extends object>(filters: TFilters): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(filters)) {
    if (UI_ONLY_KEYS.includes(key)) continue;
    if (value === undefined || value === null || value === '') continue;
    out[key] = value;
  }

  return out;
