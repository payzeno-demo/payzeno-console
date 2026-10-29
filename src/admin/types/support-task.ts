/**
 * Support tasks — `GET /v1/admin/support-tasks`, `POST /v1/admin/support-tasks/:id/resolve`.
 *
 * The row (`SupportTask`), the resolve body and the three vocabularies are contracts types
 * (`@payzeno/contracts` `types/onboarding.ts`). Only the list query is LOCAL, awaiting
 * contracts: payzeno-api's `AdminSupportTaskListQueryDto` accepts exactly these fields, but no
 * contracts interface declares them yet.
 */
import type {
  MerchantId,
  SupportTask,
  SupportTaskKind,
  SupportTaskStatus,
} from '@payzeno/contracts';

export interface SupportTaskListQuery {
  status?: SupportTaskStatus;
  kind?: SupportTaskKind;
  merchant_id?: MerchantId;
  cursor?: string;
  limit?: number;
}

/** Still needs a person: what the queue and the home tile count. */
export function isOpenSupportTask(task: Pick<SupportTask, 'status'>): boolean {
  return task.status === 'open' || task.status === 'acknowledged';
}
