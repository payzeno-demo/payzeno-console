/**
 * 403.
 *
 * Rendered by `<RequireRole>` for a whole route, and by `ErrorBoundary` when a request came
 * back forbidden anyway (the console's permission model is a cache of the API's; the API is
 * authoritative and occasionally disagrees with us).
 *
 * The copy names the permission and names who can grant it, because "you do not have
 * permission" with no next step generates a support ticket every time.
 *
 * a11y: not `role="alert"` — the user navigated here deliberately, nothing interrupted them.
 */
import { pz } from '@lib/cn';

import { Button } from '../ui/Button';
import { color, font, radius, space } from '../ui/tokens';

export interface PermissionDeniedProps {
  /** The permission the user is missing, e.g. `settlements:retry`. */
  permission?: string;
  /** What they were trying to do, in plain words: "retry a settlement item". */
  action?: string;
  requestId?: string;
  /** Usually navigates back. Omitted when this is the route's own content. */
  onBack?: () => void;
}

export function PermissionDenied({ permission, action, requestId, onBack }: PermissionDeniedProps) {
  const what = action ?? (permission ? describePermission(permission) : 'view this');

  return (
    <section
      aria-labelledby="permission-denied-heading"
      className={pz('permission-denied')}
      style={{
        display: 'grid',
        gap: space[3],
        maxWidth: '60ch',
        padding: space[6],
        fontFamily: font.family,
        color: color.textPrimary,
        background: color.warningSubtle,
        border: `1px solid ${color.warning}`,
        borderRadius: radius.lg,
      }}
    >
      <h2
        id="permission-denied-heading"
        style={{ margin: 0, fontSize: font.size.lg, fontWeight: font.weight.semibold }}
      >
        You do not have access to this
      </h2>

      <p style={{ margin: 0, fontSize: font.size.md, color: color.textSecondary }}>
        Your role does not include permission to {what}. An account owner or admin can change
        that from Settings → Team.
      </p>

      {permission ? (
        <p
          style={{
            margin: 0,
            fontFamily: font.familyMono,
            fontSize: font.size.sm,
            color: color.textMuted,
          }}
        >
          Required permission: {permission}
        </p>
      ) : null}

      {requestId ? (
        <p
          style={{
            margin: 0,
            fontFamily: font.familyMono,
            fontSize: font.size.sm,
            color: color.textMuted,
          }}
        >
          Reference {requestId}
        </p>
      ) : null}

      {onBack ? (
        <div>
          <Button size="sm" variant="secondary" onClick={onBack}>
            Go back
          </Button>
        </div>
      ) : null}
    </section>
  );
}
