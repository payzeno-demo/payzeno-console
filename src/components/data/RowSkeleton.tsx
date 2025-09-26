/**
 * Loading rows.
 *
 * Rendered inside `<tbody>` while a list query is pending. The bars vary in width across cells
 * and across rows: a grid of identical grey rectangles reads as a rendering bug, not as
 * loading. The widths come from a fixed pattern rather than `Math.random()` so that snapshot
 * tests are stable and so two renders of the same table do not jitter.
 *
 * a11y (tflexbox): the skeleton is `aria-hidden`. `<DataTable>` already sets `aria-busy` on the
 * table, and announcing eight rows of nothing is worse than announcing nothing at all.
 */
import { pz } from '@lib/cn';

import { Skeleton } from '../ui/Skeleton';
import { color, space } from '../ui/tokens';

