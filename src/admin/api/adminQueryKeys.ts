/**
 * The admin app's query-key factory — the twin of `api/queryKeys.ts`, with the same rule: a key
 * is an array whose first elements name the family, so `invalidateQueries({ queryKey:
 * adminQueryKeys.merchants.all })` refreshes every merchant list and detail at once. Never build
 * a key inline in a feature.
 *
 * Everything sits under `'admin'` so the staff app's cache can never collide with the merchant
 * console's, even in a test that renders both.
 */
import type { AdminMerchantListQuery, ReviewListQuery } from '@payzeno/contracts';

import type { AdminDisputeListQuery, EmailLookupQuery } from '../types/admin-views';
import type { SupportTaskListQuery } from '../types/support-task';

function normalize(q?: object): Record<string, unknown> {
  if (!q) return {};
  const entries = Object.entries(q as Record<string, unknown>)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b));
  return Object.fromEntries(entries);
}

export const adminQueryKeys = {
  all: ['admin'] as const,

  staffSession: {
    all: ['admin', 'staff-session'] as const,
    me: () => ['admin', 'staff-session', 'me'] as const,
  },

  merchants: {
    all: ['admin', 'merchants'] as const,
    list: (q?: AdminMerchantListQuery) => ['admin', 'merchants', 'list', normalize(q)] as const,
    detail: (id: string) => ['admin', 'merchants', 'detail', id] as const,
  },

  reviews: {
    all: ['admin', 'reviews'] as const,
    /** Every list page, whatever its filter — what a detail view seeds itself from. */
    lists: ['admin', 'reviews', 'list'] as const,
    list: (q?: ReviewListQuery) => ['admin', 'reviews', 'list', normalize(q)] as const,
    detail: (id: string) => ['admin', 'reviews', 'detail', id] as const,
  },

  disputes: {
    all: ['admin', 'disputes'] as const,
    list: (q?: AdminDisputeListQuery) => ['admin', 'disputes', 'list', normalize(q)] as const,
  },

  settlements: {
    all: ['admin', 'settlements'] as const,
    backlog: () => ['admin', 'settlements', 'backlog'] as const,
  },

  supportTasks: {
    all: ['admin', 'support-tasks'] as const,
    list: (q?: SupportTaskListQuery) => ['admin', 'support-tasks', 'list', normalize(q)] as const,
  },

  emails: {
    all: ['admin', 'emails'] as const,
    lookup: (q: EmailLookupQuery) => ['admin', 'emails', 'lookup', normalize(q)] as const,
  },
} as const;
