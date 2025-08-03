/**
 * Navigation model.
 *
 * `<SideNav />` renders this, `<RequireRole />` reads the same `requiredPermission`, and the
 * command palette searches it. One description of the app's shape, three consumers.
 */
import type { UserRole } from '@payzeno/contracts';

import type { FlagName } from '@lib/flags';

/** The console's permission vocabulary. Mirrors what `SessionResponse.permissions` carries. */
export const PERMISSIONS = [
  'payments:read',
  'payments:write',
  'refunds:write',
  'disputes:read',
  'disputes:write',
  'balance:read',
  'payouts:read',
  'payouts:write',
  'settlements:read',
  'settlements:retry',
  'invoices:read',
  'developers:read',
  'developers:write',
  'reporting:read',
  'settings:read',
  'settings:write',
  'team:invite',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/**
 * Fallback role → permission mapping.
 *
 * The API is authoritative — `SessionResponse.permissions` is what `usePermissions()` reads.
 * This table exists so `?mock=1` has something to answer with and so a session that predates a
 * new permission still renders a sensible nav instead of an empty one.
 */
export const ROLE_PERMISSIONS: Readonly<Record<UserRole, ReadonlyArray<Permission>>> = {
  owner: PERMISSIONS,
  admin: PERMISSIONS.filter((p) => p !== 'team:invite'),
  developer: [
    'payments:read',
    'disputes:read',
    'balance:read',
    'payouts:read',
    'settlements:read',
    'invoices:read',
    'developers:read',
    'developers:write',
    'reporting:read',
    'settings:read',
  ],
  viewer: [
    'payments:read',
    'disputes:read',
    'balance:read',
    'payouts:read',
    'settlements:read',
    'invoices:read',
    'reporting:read',
    'settings:read',
  ],
};

export interface NavItemSpec {
  id: string;
  label: string;
  /** Route path from `src/routes.ts`. Never a literal typed here. */
  to: string;
  /** Hidden entirely when the session lacks it — not disabled. */
  requiredPermission: Permission;
  /** Hidden when the flag is off. Only `settlements` uses this. */
  flag?: FlagName;
  /** Rendered as a count next to the label (open disputes, failing webhooks). */
  badgeKey?: 'disputes' | 'webhooks';
  /** Match child routes too — `/charges/ch_…` should light up "Charges". */
  matchPrefix?: boolean;
}

export interface NavSection {
  id: string;
  /** Rendered as the group's `aria-label`; visually a small caps heading. */
  label: string;
  items: ReadonlyArray<NavItemSpec>;
}

/** Filter a nav tree down to what this session may see. Empty sections are dropped. */
export function visibleSections(
  sections: ReadonlyArray<NavSection>,
  can: (permission: Permission) => boolean,
  flagEnabled: (flag: FlagName) => boolean,
): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => can(item.requiredPermission) && (item.flag ? flagEnabled(item.flag) : true),
      ),
    }))
    .filter((section) => section.items.length > 0);
}

/** Is this nav item the active one for `pathname`? */
export function isActive(item: NavItemSpec, pathname: string): boolean {
  if (item.matchPrefix) return pathname === item.to || pathname.startsWith(`${item.to}/`);
  return pathname === item.to;
}

/** Breadcrumb trail for a resource detail page. */
export interface Breadcrumb {
  label: string;
  to?: string;
}
