/**
 * The row of filter controls above a table.
 *
 * It is a `role="search"` region with a real accessible name, so a keyboard user can jump
 * straight to the filters, and it owns the "N filters active / Clear all" affordance — every
 * feature had its own slightly different version of that before this component existed
 * (PAY-1802).
 *
 * Filters live in URL state (`hooks/useQueryParamState.ts`), not in this component. FilterBar
 * is presentation; it does not know what a charge status is.
 */
import type { ReactNode } from 'react';

import { pz } from '@lib/cn';
import { pluralise } from '@lib/format';

