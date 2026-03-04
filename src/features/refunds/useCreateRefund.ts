/**
 * `useCreateRefund()` — `POST /v1/refunds` (api-surface.md §12).
 *
 * Three failures matter and each renders differently:
 *   422 `refund_window_closed`     — past `REFUND_WINDOW_DAYS`; nothing the merchant can do
 *                                    from here, so say so instead of offering a retry.
 *   422 `refund_amount_exceeded`   — field-level; maps onto the amount input.
 *   409 `invalid_state`            — the charge is authorised, not captured. That is a
 *                                    cancellation, not a refund, and the copy says which.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import type { CreateRefundRequest, MinorUnits, Refund } from '@payzeno/contracts';

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

import { createRefundMutation } from './refunds.queries';

export interface CreateRefundArgs {
  chargeId: string;
  amountMinor?: MinorUnits;
  reason?: CreateRefundRequest['reason'];
}

export interface UseCreateRefundResult {
  createRefund: (args: CreateRefundArgs) => void;
  isPending: boolean;
  errorMessage: string | null;
  fieldErrors: Record<string, string>;
  lastRefund: Refund | null;
  reset: () => void;
}

export function useCreateRefund(): UseCreateRefundResult {
  const endpoints = useEndpoints();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [lastRefund, setLastRefund] = useState<Refund | null>(null);

  const mutation = useMutation({
    ...createRefundMutation(endpoints),
    onMutate: () => {
      setErrorMessage(null);
      setFieldErrors({});
    },
    onSuccess: async (refund: Refund) => {
      setLastRefund(refund);
      toast.success('Refund submitted.');
      trackEvent('refund_created', { currency: refund.currency, reason: refund.reason });

      // A refund moves money: the charge, the refunds list and the balance all change.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.refunds.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.charges.detail(refund.charge_id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.balance.all }),
      ]);
    },
    onError: (error: unknown) => {
      if (error instanceof ValidationApiError) {
        setFieldErrors(error.fieldErrorMap());
        setErrorMessage(
          error.code === 'refund_window_closed'
            ? 'This charge is past the refund window. Ask support to raise a credit instead.'
            : error.message,
        );
        return;
      }

      if (error instanceof ConflictApiError) {
        setErrorMessage(
          'This charge has not been captured yet. Release the authorisation from the payment instead.',
        );
        return;
      }

      if (error instanceof ForbiddenError) {
        setErrorMessage('Issuing a refund needs an owner or admin role.');
        return;
      }

      if (error instanceof ConsoleApiError) {
        setErrorMessage(error.message);
        return;
      }

      setErrorMessage('The refund could not be submitted. Try again in a moment.');
    },
  });

  const createRefund = useCallback(
    ({ chargeId, amountMinor, reason }: CreateRefundArgs) => {
      const request: CreateRefundRequest = { charge_id: chargeId };
      if (amountMinor !== undefined) request.amount_minor = amountMinor;
      if (reason) request.reason = reason;
      mutation.mutate({ request });
    },
    [mutation],
  );

  const reset = useCallback(() => {
    setErrorMessage(null);
