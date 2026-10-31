/**
 * `renderAdmin()` — the admin twin of `renderWithProviders`.
 *
 * What is real: `ApiClient` (pointed at the MSW base), the whole `AdminProviderStack` in its
 * production order, the router, the query cache, the toast host. What is faked: the api, by
 * `adminHandlers(db)` over a fresh in-memory `AdminMockDb` per render — the same behaviour the
 * `?mock=1` demo runs on, reached through real fetches.
 *
 * Render `<AdminApp />` with a `route` to drive a page through the real guards and shell; that
 * is what nearly every admin page test does.
 */
import type { StaffRole, StaffUser } from '@payzeno/contracts';
import type { QueryClient } from '@tanstack/react-query';
import { configure, render } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { API_BASE } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { createTestQueryClient } from '@/test/render';
import { ApiClient } from '@api/client';

import { adminQueryKeys } from '../api/adminQueryKeys';
import { makeStaffUser } from '../api/mock/admin-fixtures';
import { createAdminMockDb } from '../api/mock/admin-mock-db';
import type { AdminMockDb } from '../api/mock/admin-mock-db';
import { AdminProviderStack } from '../app/AdminProviders';

import { adminHandlers } from './admin-handlers';

// The router lazy-loads every page. Importing them here moves each module's first transform into
// test collection, where it does not count against a test's timeout; `lazy()` then resolves from
// the module cache. The lazy boundaries themselves are unchanged.
import '../features/auth/StaffLoginPage';
import '../features/disputes/AdminDisputesPage';
import '../features/merchants/MerchantDetailPage';
import '../features/merchants/MerchantsPage';
import '../features/reviews/ReviewDetailPage';
import '../features/reviews/ReviewsPage';
import '../features/settlements/SettlementBacklogPage';
import '../features/support/EmailLookupPage';
import '../features/support/SupportTasksPage';

export interface RenderAdminOptions {
  route?: string;
  /** Signed in as this role (default `admin`), or `null` for signed out. */
  role?: StaffRole | null;
  /** Bring your own db to assert on its state afterwards, or to pre-shape it. */
  db?: AdminMockDb;
}

export interface RenderAdminResult extends RenderResult {
  user: UserEvent;
  queryClient: QueryClient;
  db: AdminMockDb;
  staff: StaffUser | null;
}

export const FIXED_NOW = '2026-10-29T10:00:00.000Z';

// Every admin page test drives the real router, guards, lazy pages and fetch → MSW round trips,
// several per action. On a loaded runner that is seconds, not the 1s `findBy*` default or the
// 10s per-test default. Both budgets are raised for the files that import this helper only; a
// genuinely broken assertion still fails, just later.
configure({ asyncUtilTimeout: 15_000 });
vi.setConfig({ testTimeout: 60_000 });

export function renderAdmin(ui: ReactElement, options: RenderAdminOptions = {}): RenderAdminResult {
  const role = options.role === undefined ? 'admin' : options.role;
  const staff = role === null ? null : makeStaffUser(role);
  const db = options.db ?? createAdminMockDb({ signedInAs: staff, now: () => FIXED_NOW });
  db.session = staff;

  server.use(...adminHandlers(db));

  const queryClient = createTestQueryClient();
  if (staff) {
    // Seed the bootstrap so a page test starts on its page, not on a spinner.
    queryClient.setQueryData(adminQueryKeys.staffSession.me(), { object: 'staff_session', staff });
  }

  const transport = new ApiClient({ baseUrl: API_BASE, retries: 0 });

  const result = render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[options.route ?? '/']}>
        <AdminProviderStack transport={transport} apiBaseUrl={API_BASE} queryClient={queryClient}>
          {children}
        </AdminProviderStack>
      </MemoryRouter>
    ),
  });

  // `delay: null`: no macrotask between keystrokes. Typing a rejection message is otherwise the
  // slowest thing in the suite.
  return { ...result, user: userEvent.setup({ delay: null }), queryClient, db, staff };
}
