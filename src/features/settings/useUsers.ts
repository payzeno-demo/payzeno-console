/**
 * The team tab's user list — `GET /v1/merchants/:merchantId/users`.
 *
 * LEGACY PATH. This hook does not use TanStack Query, does not use `ResourceEndpoint`, and
 * does not go through `ApiClient`. It calls `src/api/legacy/api-fetch.ts` directly, which
 * builds its own CSRF header and throws a bare `Error` instead of a `ConsoleApiError`.
 *
 * Consequences, all of them real and all of them visible here:
 *  - the list is invisible to `queryClient.invalidateQueries`, so inviting a user refetches by
 *    calling `reload()` by hand;
 *  - a 403 renders the generic `<ErrorState/>` rather than `<PermissionDenied/>`, because
 *    `error-mapper.ts` never sees the response;
 *  - there is no retry policy, no dedupe and no background refresh.
 *
 * TODO(rrefactor): move to a `UsersEndpoint` + `settings.queries.ts` factory. This is the
 * second of the two features still on the legacy fetch helpers (the other is invoices).
 * ADR 0004, PAY-1744.
 */
import { useCallback, useEffect, useState } from 'react';

import type { Paginated, User } from '@payzeno/contracts';

import { apiFetch } from '@api/legacy/api-fetch';
import { legacyStatus } from '@api/legacy/legacy-errors';
import { useCurrentMerchant, useCurrentUser } from '@app/SessionContext';
import type { TeamMemberRow } from '@/types/view-models';

export interface UseUsersResult {
  members: TeamMemberRow[];
  isLoading: boolean;
  error: Error | null;
  /** True when the API said 403. Only detectable by reading a loose property off the Error. */
  isForbidden: boolean;
  reload: () => void;
}

export function useUsers(): UseUsersResult {
  const merchant = useCurrentMerchant();
  const currentUser = useCurrentUser();

  const [isLoading, setIsLoading] = useState(true);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return {
    members,
    isLoading,
    error,
    isForbidden: legacyStatus(error) === 403,
    reload,
  };
}
