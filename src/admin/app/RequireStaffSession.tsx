/**
 * Route guards for the admin app.
 *
 *   RequireStaffSession    the signed-in branch: loading → spinner, unreachable api → a page
 *                          that says so, no session → `/login` (remembering where you were
 *                          going), session → the route.
 *   RequireNoStaffSession  `/login` only: a signed-in visitor goes where they were headed.
 *   RequireStaffSection    one section of the app: hidden from the nav for roles that cannot
 *                          open it, and denied here for anyone who types the URL anyway.
 *
 * None of this is a security boundary — every `/v1/admin/*` route checks the role again.
 */
import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { ErrorState } from '@components/feedback/ErrorState';
import { LoadingPage } from '@components/feedback/LoadingPage';
import { PageContainer } from '@components/layout/PageContainer';

import { ADMIN_ROUTES } from '../adminRoutes';
import { StaffAccessDenied } from '../components/StaffAccessDenied';

import { SECTION_ROLES } from './staff-roles';
import type { AdminSection } from './staff-roles';
import { useStaffPermissions, useStaffSessionState } from './StaffSessionContext';

export function RequireStaffSession({ children }: { children?: ReactNode }) {
  const { staff, isLoading, error, refresh } = useStaffSessionState();
  const location = useLocation();

  if (isLoading) {
    return <LoadingPage label="Loading your staff session" variant="spinner" />;
  }

  if (error) {
    return (
      <PageContainer as="main" width="narrow">
        <ErrorState error={error} title="We could not reach Payzeno" onRetry={refresh} />
      </PageContainer>
    );
  }

  if (!staff) {
    return (
      <Navigate
        to={ADMIN_ROUTES.login}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <>{children ?? <Outlet />}</>;
}

export function RequireNoStaffSession({ children }: { children?: ReactNode }) {
  const { staff, isLoading } = useStaffSessionState();
  const location = useLocation();

  if (isLoading) return null;

  if (staff) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from && from !== ADMIN_ROUTES.login ? from : ADMIN_ROUTES.home} replace />;
  }

  return <>{children ?? <Outlet />}</>;
}

export interface RequireStaffSectionProps {
  section: AdminSection;
  /** Plain words for the denial: "risk reviews". */
  what: string;
  children?: ReactNode;
}

export function RequireStaffSection({ section, what, children }: RequireStaffSectionProps) {
  const { canSee, role } = useStaffPermissions();

  if (!canSee(section)) {
    return (
      <PageContainer as="main">
        <StaffAccessDenied what={what} required={SECTION_ROLES[section]} role={role} />
      </PageContainer>
    );
  }

  return <>{children ?? <Outlet />}</>;
}
