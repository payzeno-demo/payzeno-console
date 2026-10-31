/**
 * The admin application root, below the providers: the shell around the route table, and a
 * last-resort boundary. The shell is outside the routes for the same reason as in `App.tsx` — a
 * layout route would remount the nav on every navigation.
 */
import { QueryErrorBoundary } from '@components/feedback/ErrorBoundary';

import { AdminRoutes } from './AdminRouter';
import { AdminShell } from './components/AdminShell';
import { useStaffLogout } from './features/auth/useStaffLogout';

export function AdminApp() {
  const { logout, isPending } = useStaffLogout();

  return (
    <QueryErrorBoundary feature="admin">
      <AdminShell onSignOut={logout} isSigningOut={isPending}>
        <AdminRoutes />
      </AdminShell>
    </QueryErrorBoundary>
  );
}

export default AdminApp;
