/**
 * Permission checks for the current session.
 *
 * The API is authoritative: `SessionResponse.permissions` is what this reads. The role table in
 * `types/nav.ts` is only a fallback for sessions that predate a permission, and for `?mock=1`.
 *
 * a11y note (tflexbox): prefer `disabled` + a tooltip over hiding a control the user might
 * reasonably expect. Hiding is for whole routes; disabling is for buttons.
 */
import { useCallback, useMemo } from 'react';

import { useSessionContext } from '@app/SessionContext';
import { can, canAny, isReadOnly } from '@/types/session';
import type { Permission } from '@/types/nav';

export interface Permissions {
  can: (permission: Permission) => boolean;
  canAny: (permissions: ReadonlyArray<Permission>) => boolean;
  canAll: (permissions: ReadonlyArray<Permission>) => boolean;
  /** True for `viewer` and `developer` — every mutating control renders disabled. */
  readOnly: boolean;
  /** Everything the session holds, for the developers page's debug panel. */
  granted: ReadonlyArray<Permission>;
}

export function usePermissions(): Permissions {
  const session = useSessionContext();

  const checkAny = useCallback(
    (permissions: ReadonlyArray<Permission>) => canAny(session, permissions),
    [session],
  );

}
