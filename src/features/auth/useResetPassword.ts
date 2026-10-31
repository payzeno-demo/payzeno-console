/**
 * `useResetPassword(token)` — `POST /v1/auth/password/reset/confirm` (RFC platform-v2 §4).
 *
 * Spends the one-hour `password_reset` token. The api does not sign the user in; the page
 * sends them to `/login` with the new password.
 */
import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useEndpoints } from '@app/ApiContext';

import { confirmPasswordResetMutation } from './auth.queries';
import { tokenErrorMessage } from './token-errors';

export interface UseResetPasswordResult {
  submit: (password: string) => void;
  isPending: boolean;
  isDone: boolean;
  errorMessage: string | null;
}

export function useResetPassword(token: string): UseResetPasswordResult {
  const endpoints = useEndpoints();
  const mutation = useMutation(confirmPasswordResetMutation(endpoints));

  const submit = useCallback(
    (password: string) => mutation.mutate({ token, password }),
    [mutation, token],
  );

  return {
    submit,
    isPending: mutation.isPending,
    isDone: mutation.isSuccess,
    errorMessage: mutation.error ? tokenErrorMessage(mutation.error, 'reset your password') : null,
  };
}
