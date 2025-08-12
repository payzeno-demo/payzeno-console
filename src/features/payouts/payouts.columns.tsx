/**
 * `ColumnDef<PayoutRow>[]`.
 *
 * `available_on` and `arrival_estimate` are `IsoDate` — banking calendar days, not instants.
 * They render through `DateCell precision="day"`, which splits the string instead of parsing
 * it; PAY-1904 ("payouts show yesterday") was exactly this mistake.
 */
import { Link } from 'react-router-dom';

import type { PayoutFailureCode, PayoutStatus } from '@payzeno/contracts';

import type { ColumnDef } from '@components/data/DataTable';
import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { MoneyCell } from '@components/data/MoneyCell';
import { StatusPill } from '@components/data/StatusPill';
