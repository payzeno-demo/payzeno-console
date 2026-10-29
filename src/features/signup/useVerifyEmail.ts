/**
 * `useVerifyEmail(token)` — `POST /v1/signup/verify` (RFC platform-v2 §3).
 *
 * Fires once, on mount, with the token from the emailed link. Success sets `pz_session` like a
 * login, so the session query is invalidated and the new owner lands on onboarding — the
 * first thing a `pending_review` merchant has to do.
 *
 * "Once" is enforced with a ref: React 18 StrictMode mounts effects twice in development, and
 * a verification token is single-use, so a second POST would turn a success into an
 * "invalid link" screen.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { queryKeys } from '@api/queryKeys';
import { useEndpoints } from '@app/ApiContext';
import { tokenErrorMessage } from '@features/auth/token-errors';
import { ROUTES } from '@/routes';

import { verifyEmailMutation } from './signup.queries';

export interface UseVerifyEmailResult {
  status: 'missing_token' | 'pending' | 'success' | 'error';
  errorMessage: string | null;
  retry: () => void;
}

export function useVerifyEmail(token: string | null): UseVerifyEmailResult {
  const endpoints = useEndpoints();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fired = useRef(false);

  const mutation = useMutation({
    ...verifyEmailMutation(endpoints),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.session.all });
      navigate(ROUTES.onboarding.index, { replace: true });
    },
  });
  const { mutate } = mutation;

  useEffect(() => {
    if (!token || fired.current) return;
    fired.current = true;
    mutate({ token });
  }, [token, mutate]);

  const retry = useCallback(() => {
    if (token) mutate({ token });
  }, [token, mutate]);

  if (!token) return { status: 'missing_token', errorMessage: null, retry };
  if (mutation.isError) {
    return {
      status: 'error',
      errorMessage: tokenErrorMessage(mutation.error, 'verify your email address'),
      retry,
    };
  }
  if (mutation.isSuccess) return { status: 'success', errorMessage: null, retry };
  return { status: 'pending', errorMessage: null, retry };
}
