/**
 * Added by PAY-2043 (the-incident.md §8).
 *
 * On 2025-10-24 a reconciliation retry raced the batch sweep and 218 charges were settled
 * twice. A duplicate settlement is internally balanced — the trial balance stays clean — so
 * the only merchant-visible signal was a batch whose posted total exceeded its expected
 * total. This badge is that signal, on the row it belongs to.
 *
 * It marks an item that settled after more than one attempt, which is the shape a duplicate
 * takes from the console's side. The authoritative check is PAY-2054's nightly audit
 * (exactly one `settle` transaction per settled charge); this is the human-facing hint that
 * tells finance which item to ask about.
 */
import { Badge } from '@components/ui/Badge';
import { Tooltip } from '@components/ui/Tooltip';

export interface DuplicateBadgeProps {
  attemptCount: number;
}

