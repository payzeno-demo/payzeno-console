/**
 * The admin route table. Flat, like `src/router.tsx`: a `<Route>`, a guard, a lazy page. No
 * loaders, no actions — TanStack Query owns the cache (ADR 0001).
 *
 * Each section is wrapped in `AdminSectionRoute`: role guard, then error boundary, then
 * suspense, in that order — so a role that cannot open a section gets a denial page rather than
 * an error, and a thrown 5xx is caught per section.
 */
import { Suspense, lazy } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';

import { QueryErrorBoundary } from '@components/feedback/ErrorBoundary';
import { LoadingPage } from '@components/feedback/LoadingPage';
import { NotFound } from '@components/feedback/NotFound';

import { ADMIN_ROUTES, ADMIN_ROUTE_PATTERNS } from './adminRoutes';
import { RequireNoStaffSession, RequireStaffSection, RequireStaffSession } from './app/RequireStaffSession';
import type { AdminSection } from './app/staff-roles';
import { AdminHomePage } from './features/home/AdminHomePage';

const StaffLoginPage = lazy(() =>
  import('./features/auth/StaffLoginPage').then((m) => ({ default: m.StaffLoginPage })),
);
const MerchantsPage = lazy(() =>
  import('./features/merchants/MerchantsPage').then((m) => ({ default: m.MerchantsPage })),
);
const MerchantDetailPage = lazy(() =>
  import('./features/merchants/MerchantDetailPage').then((m) => ({ default: m.MerchantDetailPage })),
);
const ReviewsPage = lazy(() =>
  import('./features/reviews/ReviewsPage').then((m) => ({ default: m.ReviewsPage })),
);
const ReviewDetailPage = lazy(() =>
  import('./features/reviews/ReviewDetailPage').then((m) => ({ default: m.ReviewDetailPage })),
);
const AdminDisputesPage = lazy(() =>
  import('./features/disputes/AdminDisputesPage').then((m) => ({ default: m.AdminDisputesPage })),
);
const SettlementBacklogPage = lazy(() =>
  import('./features/settlements/SettlementBacklogPage').then((m) => ({
    default: m.SettlementBacklogPage,
  })),
);
const SupportTasksPage = lazy(() =>
  import('./features/support/SupportTasksPage').then((m) => ({ default: m.SupportTasksPage })),
);
const EmailLookupPage = lazy(() =>
  import('./features/support/EmailLookupPage').then((m) => ({ default: m.EmailLookupPage })),
);

function AdminSectionRoute({ section, what }: { section: AdminSection; what: string }) {
  return (
    <RequireStaffSection section={section} what={what}>
      <QueryErrorBoundary feature={`admin-${section}`}>
        <Suspense fallback={<LoadingPage label={`Loading ${what}`} />}>
          <Outlet />
        </Suspense>
      </QueryErrorBoundary>
    </RequireStaffSection>
  );
}

export function AdminRoutes() {
  return (
    <Routes>
      <Route element={<RequireNoStaffSession />}>
        <Route
          path={ADMIN_ROUTE_PATTERNS.login}
          element={
            <Suspense fallback={<LoadingPage label="Loading sign in" variant="spinner" />}>
              <StaffLoginPage />
            </Suspense>
          }
        />
      </Route>

      <Route element={<RequireStaffSession />}>
        <Route
          path={ADMIN_ROUTE_PATTERNS.home}
          element={
            <QueryErrorBoundary feature="admin-home">
              <AdminHomePage />
            </QueryErrorBoundary>
          }
        />

        <Route
          path={ADMIN_ROUTE_PATTERNS.merchants}
          element={<AdminSectionRoute section="merchants" what="merchants" />}
        >
          <Route index element={<MerchantsPage />} />
          <Route path={ADMIN_ROUTE_PATTERNS.merchantDetail} element={<MerchantDetailPage />} />
        </Route>

        <Route
          path={ADMIN_ROUTE_PATTERNS.reviews}
          element={<AdminSectionRoute section="reviews" what="risk reviews" />}
        >
          <Route index element={<ReviewsPage />} />
          <Route path={ADMIN_ROUTE_PATTERNS.reviewDetail} element={<ReviewDetailPage />} />
        </Route>

        <Route
          path={ADMIN_ROUTE_PATTERNS.disputes}
          element={<AdminSectionRoute section="disputes" what="disputes" />}
        >
          <Route index element={<AdminDisputesPage />} />
        </Route>

        <Route
          path={ADMIN_ROUTE_PATTERNS.settlements}
          element={<AdminSectionRoute section="settlements" what="settlements" />}
        >
          <Route index element={<SettlementBacklogPage />} />
        </Route>

        <Route
          path={ADMIN_ROUTE_PATTERNS.support}
          element={<AdminSectionRoute section="support" what="support tasks" />}
        >
          <Route index element={<SupportTasksPage />} />
        </Route>

        <Route
          path={ADMIN_ROUTE_PATTERNS.emails}
          element={<AdminSectionRoute section="emails" what="the email lookup" />}
        >
          <Route index element={<EmailLookupPage />} />
        </Route>

        <Route
          path={ADMIN_ROUTE_PATTERNS.catchAll}
          element={
            <NotFound
              title="No such admin page"
              body="Check the address, or start again from the admin overview."
              homeTo={ADMIN_ROUTES.home}
            />
          }
        />
      </Route>
    </Routes>
  );
}
