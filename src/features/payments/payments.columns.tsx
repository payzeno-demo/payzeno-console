/**
 * `ColumnDef<PaymentIntentRow>[]`. One of the repo's hot files — every payments PR and every
 * `@payzeno/contracts` field rename lands here (`osquash`'s version-bump PRs in particular).
 */
import { Link } from 'react-router-dom';

import type { PaymentIntentStatus } from '@payzeno/contracts';

import type { ColumnDef } from '@components/data/DataTable';
import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { MoneyCell } from '@components/data/MoneyCell';
import { StatusPill } from '@components/data/StatusPill';
import { ROUTES } from '@/routes';
import type { PaymentIntentRow } from '@types/view-models';

/** What a merchant should do next, in the words they use rather than ours. */
export function statusHint(status: PaymentIntentStatus): string {
