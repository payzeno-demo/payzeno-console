/**
 * `useStaffLogout()` — `POST /v1/staff/auth/logout`.
 *
 * Clears the whole cache, not just the session: a merchant's KYC documents list rendering behind
 * the login form for the next person at a shared desk is exactly the leak this prevents.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { ADMIN_ROUTES } from '../../adminRoutes';
import { useAdminEndpoints } from '../../app/AdminApiContext';

import { staffLogoutMutation } from './staff-auth.queries';

export interface UseStaffLogoutResult {
  logout: () => void;
  isPending: boolean;
}

export function useStaffLogout(): UseStaffLogoutResult {
  const endpoints = useAdminEndpoints();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    ...staffLogoutMutation(endpoints),
    onSettled: () => {
      // On failure too: the user asked to be out, and the cookie may already be gone.
      queryClient.clear();
      navigate(ADMIN_ROUTES.login, { replace: true });
    },
  });

  const logout = useCallback(() => mutation.mutate(), [mutation]);

  return { logout, isPending: mutation.isPending };
}
