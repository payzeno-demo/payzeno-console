/**
 * `useAdminOverview()` — the counts on the admin home page.
 *
 * There is no summary endpoint; each count is the first page (limit 100) of the queue it
 * describes, through that queue's own query factory, so the home page and the queue share a
 * cache entry and a decision on the queue page drops the count here with no extra wiring.
 * A count is only fetched for a role that can open the queue — a support agent's home page does
 * not fire four requests that would 403.
 */
import type { Paginated } from '@payzeno/contracts';
import { useQuery } from '@tanstack/react-query';

import { useAdminEndpoints } from '../../app/AdminApiContext';
import type { AdminSection } from '../../app/staff-roles';
import { useStaffPermissions } from '../../app/StaffSessionContext';
import { backlogTotal } from '../../types/settlement-backlog';
import { adminDisputesQuery } from '../disputes/disputes.queries';
import { adminMerchantsQuery } from '../merchants/merchants.queries';
import { reviewsQuery } from '../reviews/reviews.queries';
import { settlementBacklogQuery } from '../settlements/settlements.queries';
import { supportTasksQuery } from '../support/support.queries';

export const OVERVIEW_PAGE_SIZE = 100;

export interface OverviewCount {
  section: AdminSection;
  /** `null` while loading or when the section is hidden from this role. */
  value: number | null;
  /** The first page was full — the real number is at least `value`. */
  atLeast: boolean;
  visible: boolean;
  isLoading: boolean;
  error: Error | null;
}

function fromPage<T>(
  section: AdminSection,
  visible: boolean,
  query: { data: Paginated<T> | undefined; isLoading: boolean; error: unknown },
): OverviewCount {
  return {
    section,
    visible,
    value: query.data ? query.data.data.length : null,
    atLeast: query.data?.has_more ?? false,
    isLoading: visible && query.isLoading,
    error: (query.error as Error | null) ?? null,
  };
}

export interface AdminOverview {
  pendingKyc: OverviewCount;
  openReviews: OverviewCount;
  disputesNeedingResponse: OverviewCount;
  settlementBacklog: OverviewCount;
  openSupportTasks: OverviewCount;
}

export function useAdminOverview(): AdminOverview {
  const endpoints = useAdminEndpoints();
  const { canSee } = useStaffPermissions();

  const page = { limit: OVERVIEW_PAGE_SIZE };

  const kyc = useQuery({
    ...adminMerchantsQuery(endpoints, { onboarding_state: 'submitted', ...page }),
    enabled: canSee('merchants'),
  });
  const reviews = useQuery({
    ...reviewsQuery(endpoints, { status: 'open', ...page }),
    enabled: canSee('reviews'),
  });
  const disputes = useQuery({
    ...adminDisputesQuery(endpoints, { status: 'needs_response', ...page }),
    enabled: canSee('disputes'),
  });
  const backlog = useQuery({ ...settlementBacklogQuery(endpoints), enabled: canSee('settlements') });
  const tasks = useQuery({
    ...supportTasksQuery(endpoints, { status: 'open', ...page }),
    enabled: canSee('support'),
  });

  return {
    pendingKyc: fromPage('merchants', canSee('merchants'), kyc),
    openReviews: fromPage('reviews', canSee('reviews'), reviews),
    disputesNeedingResponse: fromPage('disputes', canSee('disputes'), disputes),
    settlementBacklog: {
      section: 'settlements',
      visible: canSee('settlements'),
      value: backlog.data ? backlogTotal(backlog.data) : null,
      atLeast: false,
      isLoading: canSee('settlements') && backlog.isLoading,
      error: (backlog.error as Error | null) ?? null,
    },
    openSupportTasks: fromPage('support', canSee('support'), tasks),
  };
}
