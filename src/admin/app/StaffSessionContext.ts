/**
 * The signed-in staff member, over context.
 *
 * `StaffAuthProvider` is the only writer; it mounts `useStaffSession()` (the
 * `GET /v1/staff/auth/me` bootstrap) exactly once. Everything else reads this.
 */
import type { StaffRole, StaffUser } from '@payzeno/contracts';
import { createContext, useContext, useMemo } from 'react';

import { assertDefined } from '@lib/assert';

import { canPerform, canSeeSection } from './staff-roles';
import type { AdminAction, AdminSection } from './staff-roles';

export interface StaffSessionContextValue {
  staff: StaffUser | null;
  /** Bootstrap in flight. Distinguishes "not signed in" from "do not know yet". */
  isLoading: boolean;
  /** The bootstrap failed for a reason other than 401 — the api is unreachable. */
  error: Error | null;
  /** Re-read `GET /v1/staff/auth/me` — after a 401 elsewhere, or a role change. */
  refresh: () => void;
}

export const StaffSessionContext = createContext<StaffSessionContextValue | null>(null);

StaffSessionContext.displayName = 'StaffSessionContext';

const SIGNED_OUT: StaffSessionContextValue = {
  staff: null,
  isLoading: false,
  error: null,
  refresh: () => undefined,
};

export function useStaffSessionState(): StaffSessionContextValue {
  return useContext(StaffSessionContext) ?? SIGNED_OUT;
}

/**
 * @throws {InvariantViolation} without a session — only call inside `<RequireStaffSession>`.
 */
export function useCurrentStaff(): StaffUser {
  return assertDefined(
    useStaffSessionState().staff,
    'useCurrentStaff() called without a staff session',
  );
}

export interface StaffPermissions {
  role: StaffRole | null;
  canSee: (section: AdminSection) => boolean;
  can: (action: AdminAction) => boolean;
}

export function useStaffPermissions(): StaffPermissions {
  const role = useStaffSessionState().staff?.role ?? null;
  return useMemo(
    () => ({
      role,
      canSee: (section: AdminSection) => canSeeSection(role, section),
      can: (action: AdminAction) => canPerform(role, action),
    }),
    [role],
  );
}
