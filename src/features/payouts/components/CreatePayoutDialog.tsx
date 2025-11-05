/**
 * Manual payout form.
 *
 * Two constraints are enforced in the UI because the API's error for each is expensive to
 * discover: the destination account must be held in the payout currency (Payzeno does not
 * convert), and the amount cannot exceed the available balance.
 *
 * Leaving the amount at the full available balance sends no `amount_minor` at all, which is
 * what "pay out everything" means to the API and avoids racing a settlement that lands
 * between render and submit.
 */
import { useEffect, useMemo, useState } from 'react';

import type { CurrencyCode, MinorUnits, PayoutMethod } from '@payzeno/contracts';

import { InlineError } from '@components/feedback/InlineError';
import { Button } from '@components/ui/Button';
import { Dialog } from '@components/ui/Dialog';
import { Select } from '@components/ui/Select';
import { MoneyInput } from '@components/form/MoneyInput';
import { useMoneyFormat } from '@hooks/useMoneyFormat';
import { labelise, maskLastFour } from '@lib/format';
import { useBankAccounts } from '@features/settings/useBankAccounts';

import { useCreatePayout } from '../useCreatePayout';

const METHODS: ReadonlyArray<PayoutMethod> = ['standard_ach', 'same_day_ach', 'sepa', 'faster_payments'];

export interface CreatePayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: CurrencyCode;
  availableMinor: MinorUnits;
}

export function CreatePayoutDialog({
  open,
  onOpenChange,
  currency,
  availableMinor,
}: CreatePayoutDialogProps) {
  const { accounts, isLoading: accountsLoading } = useBankAccounts();
  const [method, setMethod] = useState<PayoutMethod>('standard_ach');

  const tooLarge = amountMinor > availableMinor;
}
