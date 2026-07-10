/**
 * The one route table.
 *
 * Every feature adds exactly one line here, which is why this file has the highest commit
 * count in the repo and why it is deliberately flat: a `<Route>` element, a guard, a lazy
 * import. No data loading, no `loader`, no `action` — TanStack Query owns the cache (ADR 0001)
 * and a react-router loader would be a second one.
 *
 * Shape, per blueprint §0: each feature has exactly one `<Feature>Page`, registered as the
 * feature's *index* route, and its detail pages are registered as **children** of it. The
 * child renders instead of the index, because the index element is the page itself rather than
 * an `<Outlet/>` shell — see `FeatureRoute` below.
 *
 * Code splitting: every page is `React.lazy`. The reporting overview is the landing route and
 * is imported eagerly, because a spinner on the first paint of the dashboard is the single
 * thing merchants complain about (PAY-1902). `recharts` is chunked separately in
 * `vite.config.ts`, so the eager import does not drag 250kB into the entry bundle.
 */
import { Suspense, lazy } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';

import { RequireRole } from '@app/RequireRole';
import { RequireNoSession, RequireSession } from '@app/RequireSession';
import { LoadingPage } from '@components/feedback/LoadingPage';
import { NotFound } from '@components/feedback/NotFound';
import { QueryErrorBoundary } from '@components/feedback/ErrorBoundary';
import { useFlag } from '@lib/flags';

import { ROUTES, ROUTE_PATTERNS, featureOf } from '@/routes';
import type { Permission } from '@/types/nav';

// Eager: the landing route.
import { ReportingPage } from '@features/reporting/ReportingPage';

const LoginPage = lazy(() =>
  import('@features/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const BalancePage = lazy(() =>
  import('@features/balance/BalancePage').then((m) => ({ default: m.BalancePage })),
);
const PaymentsPage = lazy(() =>
  import('@features/payments/PaymentsPage').then((m) => ({ default: m.PaymentsPage })),
);
const PaymentIntentDetailPage = lazy(() =>
  import('@features/payments/PaymentIntentDetailPage').then((m) => ({
    default: m.PaymentIntentDetailPage,
  })),
);
const ChargesPage = lazy(() =>
  import('@features/charges/ChargesPage').then((m) => ({ default: m.ChargesPage })),
);
const ChargeDetailPage = lazy(() =>
  import('@features/charges/ChargeDetailPage').then((m) => ({ default: m.ChargeDetailPage })),
);
const RefundsPage = lazy(() =>
  import('@features/refunds/RefundsPage').then((m) => ({ default: m.RefundsPage })),
);
const DisputesPage = lazy(() =>
  import('@features/disputes/DisputesPage').then((m) => ({ default: m.DisputesPage })),
);
const DisputeDetailPage = lazy(() =>
  import('@features/disputes/DisputeDetailPage').then((m) => ({ default: m.DisputeDetailPage })),
);
const PayoutsPage = lazy(() =>
  import('@features/payouts/PayoutsPage').then((m) => ({ default: m.PayoutsPage })),
);
const PayoutDetailPage = lazy(() =>
  import('@features/payouts/PayoutDetailPage').then((m) => ({ default: m.PayoutDetailPage })),
);
const SettlementsPage = lazy(() =>
  import('@features/settlements/SettlementsPage').then((m) => ({ default: m.SettlementsPage })),
);
const SettlementDetailPage = lazy(() =>
  import('@features/settlements/SettlementDetailPage').then((m) => ({
    default: m.SettlementDetailPage,
  })),
);
const InvoicesPage = lazy(() =>
  import('@features/invoices/InvoicesPage').then((m) => ({ default: m.InvoicesPage })),
);
const InvoiceDetailPage = lazy(() =>
  import('@features/invoices/InvoiceDetailPage').then((m) => ({ default: m.InvoiceDetailPage })),
);
const DevelopersPage = lazy(() =>
  import('@features/developers/DevelopersPage').then((m) => ({ default: m.DevelopersPage })),
);
const ApiKeyDetailPage = lazy(() =>
  import('@features/developers/ApiKeyDetailPage').then((m) => ({ default: m.ApiKeyDetailPage })),
);
const WebhookEventDetailPage = lazy(() =>
  import('@features/developers/WebhookEventDetailPage').then((m) => ({
    default: m.WebhookEventDetailPage,
  })),
);
const SettingsPage = lazy(() =>
  import('@features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);

/**
 * Per-feature wrapper: permission guard + error boundary + suspense fallback, in that order.
 *
 * The boundary is *inside* the guard so that a permission denial renders `<PermissionDenied/>`
 * (a page, not an error) while a thrown `ConsoleApiError` renders the boundary's fallback. The
 * `feature` tag is what makes Sentry group by feature instead of by stack frame.
 */
function FeatureRoute({ permission, label }: { permission: Permission; label: string }) {
  const { pathname } = useLocation();

  return (
    <RequireRole permission={permission} action={label}>
      <QueryErrorBoundary feature={featureOf(pathname)}>
        <Suspense fallback={<LoadingPage label={`Loading ${label}`} />}>
          <Outlet />
        </Suspense>
      </QueryErrorBoundary>
    </RequireRole>
  );
}

/**
 * The settlement explorer is flag-gated (`settlement_explorer`). The flag defaulted on months
 * ago but the route still reads it, because turning it off is the documented mitigation in
 * `docs/runbooks/console.md` when the ledger's item list is slow.
 */
function SettlementsRoute() {
  const enabled = useFlag('settlement_explorer');

  if (!enabled) {
    return (
      <NotFound
        title="Settlements are not available"
        body="The settlement explorer is turned off for this account. Your payouts page still shows when money arrived."
        homeTo={ROUTES.payouts.index}
      />
    );
  }

  return <FeatureRoute permission="settlements:read" label="settlements" />;
}

/**
 * The route table.
 *
 * Rendered inside the `<BrowserRouter>` that `AppProviders` owns — `AppProviders` has to be the
 * router's parent because `AuthProvider` navigates on a 401, so the table cannot bring its own.
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* Signed-out branch. */}
      <Route element={<RequireNoSession />}>
        <Route
          path={ROUTE_PATTERNS.login}
          element={
            <Suspense fallback={<LoadingPage label="Loading sign in" variant="spinner" />}>
              <LoginPage />
            </Suspense>
          }
        />
      </Route>

      {/* Everything below needs a session. */}
      <Route element={<RequireSession />}>
        <Route
          path={ROUTE_PATTERNS.reporting}
          element={
            <QueryErrorBoundary feature="reporting">
              <ReportingPage />
            </QueryErrorBoundary>
          }
        />

        <Route
          path={ROUTE_PATTERNS.balance}
          element={<FeatureRoute permission="balance:read" label="balance" />}
        >
          <Route index element={<BalancePage />} />
        </Route>

        <Route
          path={ROUTE_PATTERNS.payments}
          element={<FeatureRoute permission="payments:read" label="payments" />}
        >
          <Route index element={<PaymentsPage />} />
          <Route path={ROUTE_PATTERNS.paymentDetail} element={<PaymentIntentDetailPage />} />
        </Route>

        <Route
          path={ROUTE_PATTERNS.charges}
          element={<FeatureRoute permission="payments:read" label="charges" />}
        >
          <Route index element={<ChargesPage />} />
          <Route path={ROUTE_PATTERNS.chargeDetail} element={<ChargeDetailPage />} />
        </Route>

        <Route
          path={ROUTE_PATTERNS.refunds}
          element={<FeatureRoute permission="payments:read" label="refunds" />}
        >
          <Route index element={<RefundsPage />} />
        </Route>

        <Route
          path={ROUTE_PATTERNS.disputes}
          element={<FeatureRoute permission="disputes:read" label="disputes" />}
        >
          <Route index element={<DisputesPage />} />
          <Route path={ROUTE_PATTERNS.disputeDetail} element={<DisputeDetailPage />} />
        </Route>

        <Route
          path={ROUTE_PATTERNS.payouts}
          element={<FeatureRoute permission="payouts:read" label="payouts" />}
        >
          <Route index element={<PayoutsPage />} />
          <Route path={ROUTE_PATTERNS.payoutDetail} element={<PayoutDetailPage />} />
        </Route>

        <Route path={ROUTE_PATTERNS.settlements} element={<SettlementsRoute />}>
          <Route index element={<SettlementsPage />} />
          <Route path={ROUTE_PATTERNS.settlementDetail} element={<SettlementDetailPage />} />
        </Route>

        <Route
          path={ROUTE_PATTERNS.invoices}
          element={<FeatureRoute permission="invoices:read" label="invoices" />}
        >
          <Route index element={<InvoicesPage />} />
          <Route path={ROUTE_PATTERNS.invoiceDetail} element={<InvoiceDetailPage />} />
        </Route>

        <Route
          path={ROUTE_PATTERNS.developers}
          element={<FeatureRoute permission="developers:read" label="developer settings" />}
        >
          <Route index element={<DevelopersPage />} />
          <Route path={ROUTE_PATTERNS.apiKeyDetail} element={<ApiKeyDetailPage />} />
          <Route path={ROUTE_PATTERNS.webhookEventDetail} element={<WebhookEventDetailPage />} />
        </Route>

        <Route
          path={ROUTE_PATTERNS.settings}
          element={<FeatureRoute permission="settings:read" label="settings" />}
        >
          <Route index element={<SettingsPage />} />
        </Route>

        {/*
