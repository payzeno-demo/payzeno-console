/**
 * `useSignup()` — `POST /v1/signup` (RFC platform-v2 §3).
 *
 * Success does NOT sign anyone in: the api creates the merchant (`pending_review`) and an
 * `invited` owner, and emails `signup_verify`. The page swaps to "check your email" and the
 * only way forward is the link in that email (`/verify-email?token=…`).
 */
import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { SignupRequest, SignupResponse } from '@payzeno/contracts';

import { ConflictApiError, ConsoleApiError, ValidationApiError } from '@api/errors';
import { useEndpoints } from '@app/ApiContext';

import { signupMutation } from './signup.queries';

export interface UseSignupResult {
  submit: (request: SignupRequest) => void;
  isPending: boolean;
  errorMessage: string | null;
  fieldErrors: Record<string, string>;
  /** Set once the api accepted the signup — the address the verification email went to. */
  sentTo: string | null;
  response: SignupResponse | undefined;
}

export function useSignup(): UseSignupResult {
  const endpoints = useEndpoints();
  const mutation = useMutation(signupMutation(endpoints));

  const submit = useCallback((request: SignupRequest) => mutation.mutate(request), [mutation]);

  const error = mutation.error;
  let errorMessage: string | null = null;
  let fieldErrors: Record<string, string> = {};

  if (error instanceof ValidationApiError) {
    fieldErrors = error.fieldErrorMap();
    errorMessage = 'Check the highlighted fields.';
  } else if (error instanceof ConflictApiError) {
    // The api says 409 for an address that already has an account. Saying so is the only way
    // forward for a real owner; the reset-password link covers the "it's me" case.
    errorMessage = 'An account already uses that email address. Sign in, or reset your password.';
  } else if (error instanceof ConsoleApiError) {
    errorMessage = error.message;
  } else if (error) {
    errorMessage = 'We could not create your account. Try again in a moment.';
  }

  return {
    submit,
    isPending: mutation.isPending,
    errorMessage,
    fieldErrors,
    sentTo: mutation.isSuccess ? mutation.variables?.email ?? null : null,
    response: mutation.data,
  };
}
