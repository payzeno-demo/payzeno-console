/**
 * The shape every staff mutation in the admin app shares.
 *
 * Each feature hook (`useMerchantDecision`, `useReviewDecision`, `useAcceptDispute`, …) is this
 * plus its own factory from `<f>.queries.ts`, its own wording and its own invalidation list.
 * Centralising the rest is what makes "every mutation shows the result and refreshes queries"
 * true by construction rather than by review:
 *
 *  - success → a toast, an on-page `ActionOutcome`, and an awaited invalidation of every listed
 *    query family, so the dialog closes onto fresh data (ADR 0001: invalidation is written, not
 *    hoped for);
 *  - failure → one sentence for the dialog (`describeMutationError`), a toast for anything that is
 *    not a validation problem, and a session re-check on 401;
 *  - a 409 also invalidates: a conflict means our copy is stale, and the refetch shows why.
 *
 * Mutations never retry (QueryProvider), and `ApiClient` mints one idempotency key per attempt.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { ConflictApiError, ValidationApiError } from '@api/errors';
import { useToast } from '@app/ToastProvider';

import { useStaffSessionState } from '../app/StaffSessionContext';
import type { ActionOutcome } from '../components/ActionOutcome';
import { describeMutationError, isSessionExpired } from '../lib/mutation-errors';

export interface StaffActionConfig<TVars, TResult> {
  mutationKey: ReadonlyArray<unknown>;
  mutationFn: (vars: TVars) => Promise<TResult>;
  /** Query families to refetch after success (and after a 409). */
  invalidate: (vars: TVars) => ReadonlyArray<QueryKey>;
  /** What to tell the user it did. */
  success: (result: TResult, vars: TVars) => ActionOutcome;
  /** Completes "Payzeno refused this: …" on a 403. */
  forbidden: string;
  conflict?: string;
  /**
   * An error that is a normal outcome rather than a failure — `409 settlement_locked` on a retry.
   * Return the outcome to show, or `null` to treat it as an error.
   */
  expectedError?: (error: unknown, vars: TVars) => ActionOutcome | null;
}

export interface RunOptions {
  /** Called after success and invalidation — pages close their dialog here. */
  onSuccess?: () => void;
}

export interface StaffActionResult<TVars> {
  run: (vars: TVars, options?: RunOptions) => void;
  isPending: boolean;
  /** The last failure, in words, for the open dialog. Cleared by the next attempt. */
  errorMessage: string | null;
  outcome: ActionOutcome | null;
  clearOutcome: () => void;
  /** Forget the last error (a dialog was closed). */
  reset: () => void;
}

export function useStaffAction<TVars, TResult>(
  config: StaffActionConfig<TVars, TResult>,
): StaffActionResult<TVars> {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { refresh } = useStaffSessionState();

  const [outcome, setOutcome] = useState<ActionOutcome | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { invalidate, success, forbidden, conflict, expectedError } = config;

  const refetchAll = useCallback(
    async (vars: TVars) => {
      await Promise.all(
        invalidate(vars).map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      );
    },
    [invalidate, queryClient],
  );

  const mutation = useMutation<TResult, unknown, TVars>({
    mutationKey: [...config.mutationKey],
    mutationFn: config.mutationFn,
    onMutate: () => {
      setErrorMessage(null);
    },
    onSuccess: async (result, vars) => {
      const next = success(result, vars);
      setOutcome(next);
      toast.success(next.title);
      await refetchAll(vars);
    },
    onError: async (error, vars) => {
      const expected = expectedError?.(error, vars) ?? null;
      if (expected) {
        setOutcome(expected);
        toast.info(expected.title);
        await refetchAll(vars);
        return;
      }

      const message = describeMutationError(error, { forbidden, conflict });
      setErrorMessage(message);
      if (isSessionExpired(error)) {
        refresh();
        return;
      }
      if (!(error instanceof ValidationApiError)) toast.error(message);
      if (error instanceof ConflictApiError) await refetchAll(vars);
    },
  });

  const { mutate, reset: resetMutation } = mutation;

  const run = useCallback(
    (vars: TVars, options?: RunOptions) => {
      mutate(vars, {
        onSuccess: () => options?.onSuccess?.(),
        onError: (error) => {
          // An expected error is a success as far as the dialog is concerned.
          if (expectedError?.(error, vars)) options?.onSuccess?.();
        },
      });
    },
    [mutate, expectedError],
  );

  const clearOutcome = useCallback(() => setOutcome(null), []);
  const reset = useCallback(() => {
    setErrorMessage(null);
    resetMutation();
  }, [resetMutation]);

  return { run, isPending: mutation.isPending, errorMessage, outcome, clearOutcome, reset };
}
