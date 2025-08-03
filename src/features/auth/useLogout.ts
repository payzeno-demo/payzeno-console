/**
 * `useLogout()` — `POST /v1/auth/logout` (api-surface.md §12).
 *
 * Clears the whole query cache, not just the session query. A stale `charges` page rendering
 * behind a login screen after an account switch is the kind of thing that ends up in a
 * support ticket about "seeing another merchant's data" even when it is only our cache.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useEndpoints } from '@app/ApiContext';
import { ROUTES } from '@/routes';

import { logoutMutation } from './auth.queries';

export interface UseLogoutResult {
  logout: () => void;
  isPending: boolean;
}

export function useLogout(): UseLogoutResult {
  const endpoints = useEndpoints();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    ...logoutMutation(endpoints),
    onSettled: () => {
      // Runs on failure too: if the logout POST 500s the user still expects to be out, and
      // the session cookie may well have been cleared before the handler threw.
      queryClient.clear();
      navigate(ROUTES.auth.login, { replace: true });
    },
  });

  const logout = useCallback(() => mutation.mutate(), [mutation]);

  return { logout, isPending: mutation.isPending };
}
