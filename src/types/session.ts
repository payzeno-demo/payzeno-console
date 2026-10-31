/**
 * Session view model.
 *
 * `SessionResponse` is the frozen bootstrap payload (`GET /v1/auth/me`). The console needs a
 * little more around it — a resolved permission set, the livemode toggle position — and none of
 * that belongs on the wire.
 */
import type { Merchant, MerchantStatus, SessionResponse, User, UserRole } from '@payzeno/contracts';

import { ROLE_PERMISSIONS } from './nav';
import type { Permission } from './nav';

export interface ConsoleSession extends SessionResponse {
  /** `permissions` as a Set, resolved against the role table when the API sends none. */
  _permissions: ReadonlySet<Permission>;
  /** Livemode toggle position. Defaults to `merchant.livemode`; the user may flip it. */
  _livemode: boolean;
}

function isPermission(value: string): value is Permission {
  return (ROLE_PERMISSIONS.owner as ReadonlyArray<string>).includes(value);
}

/**
 * Merchant statuses that have never been `active`. RFC platform-v2 §3: payzeno-api refuses a
 * live payment for these with `403 merchant_not_activated`, so the console starts them in test
 * mode and `LivemodeToggle` keeps them there. `restricted` / `suspended` merchants were active
 * once and still have live data to look at, so they are deliberately not in this list.
 */
export const NOT_YET_ACTIVATED_STATUSES: ReadonlySet<MerchantStatus> = new Set<MerchantStatus>([
  'pending_review',
  'rejected',
]);

export function isNotYetActivated(merchant: Pick<Merchant, 'status'>): boolean {
  return NOT_YET_ACTIVATED_STATUSES.has(merchant.status);
}

/**
 * Build the console session from the API response.
 *
 * The API's `permissions` array wins. The role table is only consulted when it comes back
 * empty, which happens for sessions issued before PAY-1750 and for `?mock=1`.
 */
export function toConsoleSession(response: SessionResponse, livemode?: boolean): ConsoleSession {
  const fromApi = response.permissions.filter(isPermission);
  const resolved = fromApi.length > 0 ? fromApi : ROLE_PERMISSIONS[response.user.role];
  const defaultLivemode = isNotYetActivated(response.merchant) ? false : response.merchant.livemode;

  return {
    ...response,
    _permissions: new Set(resolved),
    _livemode: livemode ?? defaultLivemode,
  };
}

export function can(session: ConsoleSession | null, permission: Permission): boolean {
  return session?._permissions.has(permission) ?? false;
}

/** Any of. Used by nav sections that unlock on more than one permission. */
export function canAny(
  session: ConsoleSession | null,
  permissions: ReadonlyArray<Permission>,
): boolean {
  return permissions.some((permission) => can(session, permission));
}

export function currentUser(session: ConsoleSession | null): User | null {
  return session?.user ?? null;
}

export function currentMerchant(session: ConsoleSession | null): Merchant | null {
  return session?.merchant ?? null;
}

/** `Noa Migration` → `NM`. Avatar fallback in `<UserMenu />`. */
export function initialsOf(user: User): string {
  const parts = user.full_name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return user.email.slice(0, 2).toUpperCase();
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

/** Roles that may act on money. `viewer` and `developer` see the buttons disabled, not hidden. */
export const MUTATING_ROLES: ReadonlySet<UserRole> = new Set<UserRole>(['owner', 'admin']);

export function isReadOnly(session: ConsoleSession | null): boolean {
  if (!session) return true;
  return !MUTATING_ROLES.has(session.user.role);
}

/** Flip the livemode toggle. Returns a new session object; the provider re-renders on it. */
export function withLivemode(session: ConsoleSession, livemode: boolean): ConsoleSession {
  return { ...session, _livemode: livemode };
}
