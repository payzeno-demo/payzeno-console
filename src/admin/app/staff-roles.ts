/**
 * Who may see and do what in the admin back office (RFC platform-v2 §1).
 *
 *   Merchants     every role reads; `risk` decides onboarding and changes status
 *   Risk reviews  `risk`
 *   Disputes      `risk`
 *   Settlements   `finance`
 *   Support       `support` (tasks and the email lookup)
 *
 * `admin` passes every check. Like `usePermissions()` in the merchant console this is a courtesy
 * cache of the api's rules — every `/v1/admin/*` route re-checks with `@StaffOnly(...)` — so the
 * worst a stale table here can do is show a button that answers 403.
 */
import type { StaffRole } from '@payzeno/contracts';

export type AdminSection =
  | 'home'
  | 'merchants'
  | 'reviews'
  | 'disputes'
  | 'settlements'
  | 'support'
  | 'emails';

export type AdminAction =
  | 'merchants:decide'
  | 'reviews:decide'
  | 'disputes:accept'
  | 'settlements:retry'
  | 'support:resolve';

/** `'all'` = any signed-in staff member. */
export type RoleRequirement = ReadonlyArray<StaffRole> | 'all';

export const SECTION_ROLES: Readonly<Record<AdminSection, RoleRequirement>> = {
  home: 'all',
  merchants: 'all',
  reviews: ['risk'],
  disputes: ['risk'],
  settlements: ['finance'],
  support: ['support'],
  emails: ['support'],
};

export const ACTION_ROLES: Readonly<Record<AdminAction, ReadonlyArray<StaffRole>>> = {
  'merchants:decide': ['risk'],
  'reviews:decide': ['risk'],
  'disputes:accept': ['risk'],
  'settlements:retry': ['finance'],
  'support:resolve': ['support'],
};

export const STAFF_ROLE_LABELS: Readonly<Record<StaffRole, string>> = {
  support: 'Support',
  risk: 'Risk',
  finance: 'Finance',
  admin: 'Admin',
};

export function hasStaffRole(
  role: StaffRole | null | undefined,
  required: RoleRequirement,
): boolean {
  if (!role) return false;
  if (role === 'admin' || required === 'all') return true;
  return required.includes(role);
}

export function canSeeSection(role: StaffRole | null | undefined, section: AdminSection): boolean {
  return hasStaffRole(role, SECTION_ROLES[section]);
}

export function canPerform(role: StaffRole | null | undefined, action: AdminAction): boolean {
  return hasStaffRole(role, ACTION_ROLES[action]);
}

/** "the risk role" / "the risk or finance role" — for disabled-button reasons and denials. */
export function describeRequirement(required: RoleRequirement): string {
  if (required === 'all') return 'a staff account';
  const names = required.map((role) => STAFF_ROLE_LABELS[role].toLowerCase());
  return `the ${names.join(' or ')} role`;
}
