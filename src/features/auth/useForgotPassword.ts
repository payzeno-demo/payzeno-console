/**
 * `useForgotPassword()` — `POST /v1/auth/password/reset` (RFC platform-v2 §4).
 *
 * The api answers 202 whether or not the address has an account, and so does this hook: the
 * page says "if there is an account, we emailed it" either way. Only a transport failure is
 * an error worth showing.
 */
import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';

import { ConsoleApiError, RateLimitedApiError } from '@api/errors';
import { useEndpoints } from '@app/ApiContext';

import { passwordResetMutation } from './auth.queries';

export interface UseForgotPasswordResult {
  submit: (email: string) => void;
  isPending: boolean;
  sentTo: string | null;
  errorMessage: string | null;
}

export function useForgotPassword(): UseForgotPasswordResult {
  const endpoints = useEndpoints();
  const mutation = useMutation(passwordResetMutation(endpoints));

  const submit = useCallback((email: string) => mutation.mutate(email.trim()), [mutation]);

  let errorMessage: string | null = null;
  if (mutation.error instanceof RateLimitedApiError) {
    errorMessage = 'Too many reset requests. Wait a few minutes and try again.';
  } else if (mutation.error instanceof ConsoleApiError && mutation.error.status >= 500) {
    errorMessage = 'We could not send the email just now. Try again in a moment.';
  } else if (mutation.error && !(mutation.error instanceof ConsoleApiError)) {
    errorMessage = 'We could not send the email just now. Try again in a moment.';
  }

  // A 4xx other than 429 still reads as "sent": the api never confirms an address exists.
  const accepted =
    mutation.isSuccess ||
    (mutation.error instanceof ConsoleApiError &&
      mutation.error.status < 500 &&
      !(mutation.error instanceof RateLimitedApiError));

  return {
    submit,
    isPending: mutation.isPending,
    sentTo: accepted ? mutation.variables ?? null : null,
    errorMessage,
  };
}
