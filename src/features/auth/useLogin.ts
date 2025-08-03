/**
 * `useLogin()` — `POST /v1/auth/login` (api-surface.md §12).
 *
 * The response sets `pz_session` (HttpOnly) and `pz_csrf` (readable). Nothing in the console
 * stores a token: after a successful login we invalidate the session query and let
 * `useSession()` re-bootstrap from `GET /v1/auth/me`, which is also what refreshes the CSRF
 * cookie.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import type { LoginRequest, LoginResponse } from '@payzeno/contracts';

import { useEndpoints } from '@app/ApiContext';
import { ConsoleApiError, UnauthorizedError, ValidationApiError } from '@api/errors';
import { queryKeys } from '@api/queryKeys';
import { ROUTES } from '@/routes';

import { loginMutation } from './auth.queries';

export interface UseLoginResult {
  submit: (request: LoginRequest) => void;
  isPending: boolean;
  /** Human-readable, already mapped from the error subclass. */
  errorMessage: string | null;
  fieldErrors: Record<string, string>;
}

export function useLogin(redirectTo: string = ROUTES.reporting.index): UseLoginResult {
  const endpoints = useEndpoints();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    ...loginMutation(endpoints),
    onSuccess: async (_response: LoginResponse) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.session.all });
      navigate(redirectTo, { replace: true });
    },
  });

  const submit = useCallback(
    (request: LoginRequest) => mutation.mutate({ request }),
    [mutation],
  );

  const error = mutation.error;
  let errorMessage: string | null = null;
  let fieldErrors: Record<string, string> = {};

  if (error instanceof UnauthorizedError) {
    // Deliberately vague: confirming which half was wrong is an enumeration oracle.
    errorMessage = 'That email and password do not match.';
  } else if (error instanceof ValidationApiError) {
    fieldErrors = error.fieldErrorMap();
    errorMessage = 'Check the highlighted fields.';
  } else if (error instanceof ConsoleApiError) {
    errorMessage = error.message;
  } else if (error) {
    errorMessage = 'We could not sign you in. Try again.';
  }

  return { submit, isPending: mutation.isPending, errorMessage, fieldErrors };
}
