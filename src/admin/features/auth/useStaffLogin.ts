/**
 * `useStaffLogin()` — `POST /v1/staff/auth/login`.
 *
 * The response sets `pz_staff_session` (HttpOnly) and `pz_csrf`. Nothing is stored client-side:
 * the response seeds the session query so the guard sees the new staff member immediately, and
 * the bootstrap is re-read so the CSRF cookie and the role come from `GET /v1/staff/auth/me`.
 */
import type { StaffLoginRequest, StaffSessionResponse } from '@payzeno/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  ConsoleApiError,
  RateLimitedApiError,
  UnauthorizedError,
  ValidationApiError,
} from '@api/errors';

import { ADMIN_ROUTES } from '../../adminRoutes';
import { adminQueryKeys } from '../../api/adminQueryKeys';
import { useAdminEndpoints } from '../../app/AdminApiContext';

import { staffLoginMutation } from './staff-auth.queries';

export interface UseStaffLoginResult {
  submit: (request: StaffLoginRequest) => void;
  isPending: boolean;
  errorMessage: string | null;
  fieldErrors: Record<string, string>;
}

export function useStaffLogin(redirectTo: string = ADMIN_ROUTES.home): UseStaffLoginResult {
  const endpoints = useAdminEndpoints();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    ...staffLoginMutation(endpoints),
    onSuccess: async (response: StaffSessionResponse) => {
      queryClient.setQueryData(adminQueryKeys.staffSession.me(), response);
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.staffSession.all });
      navigate(redirectTo, { replace: true });
    },
  });

  const submit = useCallback((request: StaffLoginRequest) => mutation.mutate(request), [mutation]);

  const error = mutation.error;
  let errorMessage: string | null = null;
  let fieldErrors: Record<string, string> = {};

  if (error instanceof UnauthorizedError) {
    // Deliberately vague: saying which half was wrong is an enumeration oracle.
    errorMessage = 'That email and password do not match a staff account.';
  } else if (error instanceof RateLimitedApiError) {
    errorMessage = `Too many sign-in attempts. Try again in ${error.retryAfter} seconds.`;
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
