/**
 * `ColumnDef<SettlementRow>[]` for the settlements list.
 *
 * Renamed from `columns.tsx` in the PAY-2043 PR. Every money cell goes through `MoneyCell`,
 * which goes through `useMoneyFormat` -> `lib/money.ts` -> `@payzeno/contracts::formatMoney`.
 * There is no `amount / 100` anywhere in this file, because JPY exists.
 */
import { Link } from 'react-router-dom';

import type { SettlementBatchStatus } from '@payzeno/contracts';

import type { ColumnDef } from '@components/data/DataTable';
import { AcquirerCell } from '@components/data/AcquirerCell';
import { DateCell } from '@components/data/DateCell';
import { IdCell } from '@components/data/IdCell';
import { MoneyCell } from '@components/data/MoneyCell';
