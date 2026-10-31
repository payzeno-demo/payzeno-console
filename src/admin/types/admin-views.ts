/**
 * Admin view models and the two list queries the contracts do not declare yet.
 *
 * View models only ever `extends` a `@payzeno/contracts` type (README, "Where things live").
 * The two query interfaces are LOCAL, awaiting contracts: payzeno-api's
 * `AdminDisputeListQueryDto` and `AdminEmailLookupQueryDto` accept exactly these fields.
 */
import type {
  AdminMerchantSummary,
  DisputeStatus,
  MerchantId,
} from '@payzeno/contracts';

/** `DataTable` keys rows on `id`; a summary keeps its id one level down. */
export interface AdminMerchantRow extends AdminMerchantSummary {
  id: MerchantId;
}

export function toMerchantRow(summary: AdminMerchantSummary): AdminMerchantRow {
  return { ...summary, id: summary.merchant.id };
}

/** `GET /v1/admin/disputes` query. */
export interface AdminDisputeListQuery {
  status?: DisputeStatus;
  merchant_id?: MerchantId;
  cursor?: string;
  limit?: number;
}

/** `GET /v1/admin/emails?to=`. */
export interface EmailLookupQuery {
  to: string;
  cursor?: string;
  limit?: number;
}
