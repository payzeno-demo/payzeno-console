/**
 * Create a price (RFC platform-v2 §6): one-off, or recurring every N months/years.
 *
 * Prices are immutable once created, so the dialog says so; a wrong price is archived and
 * replaced, never edited — a subscription already billing on it must keep its terms.
 */
import { useEffect, useState } from 'react';

import { RECURRING_INTERVALS } from '@payzeno/contracts';
import type { CreatePriceRequest, CurrencyCode, RecurringInterval } from '@payzeno/contracts';

import { InlineError } from '@components/feedback/InlineError';
import { CurrencySelect } from '@components/form/CurrencySelect';
import { MoneyInput } from '@components/form/MoneyInput';
import { TextField } from '@components/form/TextField';
import { Button } from '@components/ui/Button';
import { Dialog } from '@components/ui/Dialog';
import { RadioGroup } from '@components/ui/RadioGroup';
import { Select } from '@components/ui/Select';

import { useCreatePrice } from '../useCreatePrice';

type Kind = 'recurring' | 'one_off';

export interface CreatePriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCurrency: CurrencyCode;
}

export function CreatePriceDialog({ open, onOpenChange, defaultCurrency }: CreatePriceDialogProps) {
  const { createPrice, isPending, errorMessage, fieldErrors, createdPrice, reset } =
    useCreatePrice();

  const [productName, setProductName] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [amountMinor, setAmountMinor] = useState(0);
  const [kind, setKind] = useState<Kind>('recurring');
  const [interval, setRecurringInterval] = useState<RecurringInterval>('month');
  const [intervalCount, setIntervalCount] = useState('1');

  useEffect(() => {
    if (!open) return;
    reset();
    setProductName('');
    setCurrency(defaultCurrency);
    setAmountMinor(0);
    setKind('recurring');
    setRecurringInterval('month');
    setIntervalCount('1');
    // `reset` is stable per mutation; re-running on it would clear a fresh error.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultCurrency]);

  useEffect(() => {
    if (createdPrice) onOpenChange(false);
  }, [createdPrice, onOpenChange]);

  const count = Number.parseInt(intervalCount, 10);
  const countValid = Number.isInteger(count) && count >= 1 && count <= 12;
  const valid =
    productName.trim().length > 0 && amountMinor > 0 && (kind === 'one_off' || countValid);

  const handleSubmit = () => {
    if (!valid || isPending) return;
    const request: CreatePriceRequest = {
      product_name: productName.trim(),
      unit_amount_minor: amountMinor,
      currency,
    };
    if (kind === 'recurring') request.recurring = { interval, interval_count: count };
    createPrice(request);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="New price"
      description="Prices cannot be edited once created. Subscriptions keep the price they started on."
      footer={
        <>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!valid || isPending}>
            {isPending ? 'Creating…' : 'Create price'}
          </Button>
        </>
      }
    >
      <TextField
        id="price-product-name"
        label="Product name"
        required
        hint="What the customer sees on checkout and receipts."
        value={productName}
        onValueChange={setProductName}
        error={fieldErrors.product_name}
      />

      <CurrencySelect
        id="price-currency"
        label="Currency"
        value={currency}
        onChange={setCurrency}
      />

      <MoneyInput
        id="price-amount"
        label="Amount"
        currency={currency}
        valueMinor={amountMinor}
        onValueChange={setAmountMinor}
        invalid={Boolean(fieldErrors.unit_amount_minor)}
        errorId="price-amount-error"
      />
      {fieldErrors.unit_amount_minor ? (
        <InlineError id="price-amount-error">{fieldErrors.unit_amount_minor}</InlineError>
      ) : null}

      <RadioGroup<Kind>
        name="price-kind"
        legend="Billing"
        value={kind}
        onValueChange={setKind}
        inline
        options={[
          { value: 'recurring', label: 'Recurring', description: 'Starts a subscription.' },
          { value: 'one_off', label: 'One-off', description: 'A single payment.' },
        ]}
      />

      {kind === 'recurring' ? (
        <>
          <TextField
            id="price-interval-count"
            label="Every"
            type="number"
            min={1}
            max={12}
            inputMode="numeric"
            value={intervalCount}
            onValueChange={setIntervalCount}
            error={countValid ? fieldErrors['recurring.interval_count'] : 'Between 1 and 12.'}
          />
          <Select<RecurringInterval>
            id="price-interval"
            label="Interval"
            value={interval}
            onValueChange={setRecurringInterval}
            options={RECURRING_INTERVALS.map((value) => ({
              value,
              label: value === 'month' ? 'Month(s)' : 'Year(s)',
            }))}
          />
        </>
      ) : null}

      {errorMessage ? <InlineError id="price-error">{errorMessage}</InlineError> : null}
    </Dialog>
  );
}
