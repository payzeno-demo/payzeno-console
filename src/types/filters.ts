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
