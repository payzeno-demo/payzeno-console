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
import { humanise, labelise } from '@lib/format';
import { ROUTES } from '@/routes';
import type { PayoutRow } from '@/types/view-models';

/** What each failure code means in words a merchant can act on. */
export function failureHint(code: PayoutFailureCode): string {
  switch (code) {
    case 'account_closed':
      return 'The bank account is closed. Add a new one before the next payout.';
    case 'no_account':
      return 'The bank could not find the account. Check the details.';
    case 'invalid_details':
      return 'The account details were rejected by the bank.';
    case 'debit_not_authorized':
      return 'Your bank refused the debit. A mandate may be missing.';
