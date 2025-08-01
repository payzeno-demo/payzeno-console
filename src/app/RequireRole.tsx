/**
 * Route guard: the session must hold a permission.
 *
 * Renders `<PermissionDenied />` rather than redirecting. A redirect to the dashboard tells
 * the user nothing about why the page they bookmarked no longer works, and produces a support
 * ticket; the denial page names the permission and says who can grant it.
 *
 * The console's permission model is a **cache** of the API's — `usePermissions()` reads
 * `SessionResponse.permissions`, and the API re-checks on every request. This guard is a
 * courtesy, not a security boundary, and the comment is here because a reviewer asked exactly
 * that question on PR #188.
 *
 * Hidden vs disabled, for the hundredth time (tflexbox): whole routes are hidden from the nav
 * and denied here; individual controls are rendered disabled with a reason.
 */
import { Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';

import type { Permission } from '@/types/nav';

import { PermissionDenied } from '@components/feedback/PermissionDenied';
import { usePermissions } from '@hooks/usePermissions';

export interface RequireRoleProps {
  /** The permission this route needs. */
  permission: Permission;
  /** Any of these is enough. Use for routes reachable two ways. */
  anyOf?: ReadonlyArray<Permission>;
  children?: ReactNode;
  /** Plain-words description for the denial page: "manage API keys". */
  action?: string;
}

export function RequireRole({ permission, anyOf, children, action }: RequireRoleProps) {
  const permissions = usePermissions();

  const allowed = anyOf && anyOf.length > 0 ? permissions.canAny(anyOf) : permissions.can(permission);

  if (!allowed) {
    return <PermissionDenied permission={permission} action={action} />;
  }

  return <>{children ?? <Outlet />}</>;
}

/**
 * Render-prop variant for a *section* of a page rather than a route — the settlement retry
 * column, the "invite user" button's whole row.
 *
 * Returns `null` when denied, because a section that is not there needs no explanation; the
 * page around it still makes sense.
 */
export function IfPermitted({
  permission,
  children,
  otherwise = null,
}: {
  permission: Permission;
  children: ReactNode;
  otherwise?: ReactNode;
}) {
  const { can } = usePermissions();
  return <>{can(permission) ? children : otherwise}</>;
}
