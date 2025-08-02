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

