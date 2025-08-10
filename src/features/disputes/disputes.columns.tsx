/**
 * `ColumnDef<DisputeRow>[]`.
 *
 * The "Respond by" column is the whole point of this table. It renders the remaining hours,
 * not the raw timestamp, because every merchant who has ever lost a dispute lost it by
 * reading a due date in the wrong timezone.
 */
import { Link } from 'react-router-dom';

import type { DisputeReason, DisputeStatus } from '@payzeno/contracts';

import type { ColumnDef } from '@components/data/DataTable';
import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { MoneyCell } from '@components/data/MoneyCell';
import { StatusPill } from '@components/data/StatusPill';
import { humanise } from '@lib/format';
import { ROUTES } from '@/routes';
