/**
 * `useCreatePayout()` — `POST /v1/payouts` (api-surface.md §12).
 *
 * The failures that actually happen, in order of frequency:
 *   409 `payout_blocked`     — the merchant's balance is negative, or the account is frozen.
 *   422 `currency_mismatch`  — the chosen bank account is not in the payout currency. Payzeno
 *                              does not convert; this is a real constraint, not a validator
 *                              being fussy.
 *   403                      — `payouts:write` is admin-only.
 *
 * Each gets its own sentence, because "Something went wrong" on a payout form generates a
 * support ticket every single time.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import type {
  CreatePayoutRequest,
  CurrencyCode,
  MinorUnits,
  Payout,
  PayoutMethod,
} from '@payzeno/contracts';

import {
  ConflictApiError,
  ConsoleApiError,
  ForbiddenError,
  ValidationApiError,
} from '@api/errors';
import { queryKeys } from '@api/queryKeys';
import { useEndpoints } from '@app/ApiContext';
import { useToast } from '@app/ToastProvider';
import { trackEvent } from '@lib/telemetry';

import { createPayoutMutation } from './payouts.queries';

export interface CreatePayoutArgs {
  currency: CurrencyCode;
  /** Omit for "everything available". */
  amountMinor?: MinorUnits;
  bankAccountId?: string;
  method?: PayoutMethod;
  statementDescriptor?: string;
}

export interface UseCreatePayoutResult {
  createPayout: (args: CreatePayoutArgs) => void;
  isPending: boolean;
  errorMessage: string | null;
  fieldErrors: Record<string, string>;
  /** Set on success so the dialog can close and the page can link to the new payout. */
  createdPayout: Payout | null;
}

export function useCreatePayout(): UseCreatePayoutResult {
  const endpoints = useEndpoints();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [createdPayout, setCreatedPayout] = useState<Payout | null>(null);

  const mutation = useMutation({
    ...createPayoutMutation(endpoints),
    onMutate: () => {
      setErrorMessage(null);
      setFieldErrors({});
    },
    onSuccess: async (payout: Payout) => {
      setCreatedPayout(payout);
      toast.success(`Payout ${payout.id} scheduled.`);
      trackEvent('payout_created', { currency: payout.currency, method: payout.method });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.payouts.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.balance.all }),
      ]);
    },
    onError: (error: unknown) => {
      if (error instanceof ConflictApiError) {
        setErrorMessage(
          error.code === 'payout_blocked'
            ? 'Payouts are blocked while your balance is negative.'
            : 'This payout conflicts with one already in flight.',
        );
        return;
      }

      if (error instanceof ValidationApiError) {
        setFieldErrors(error.fieldErrorMap());
        setErrorMessage(
          error.code === 'currency_mismatch'
            ? 'That bank account is not held in this currency. Payzeno does not convert.'
            : error.message,
        );
        return;
      }

      if (error instanceof ForbiddenError) {
        setErrorMessage('Creating a payout needs an admin role.');
