/**
 * `useAcceptInvitation(token)` — `POST /v1/auth/invitations/accept` (RFC platform-v2 §4).
 *
 * Spends the 72-hour `team_invite` token, sets the new member's name and password, and signs
 * them in (`pz_session`, same as login). The session query is invalidated so the shell
 * bootstraps as them, and they land on the dashboard.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { queryKeys } from '@api/queryKeys';
import { useEndpoints } from '@app/ApiContext';
import { ROUTES } from '@/routes';

import { acceptInvitationMutation } from './auth.queries';
import { tokenErrorMessage } from './token-errors';

export interface UseAcceptInvitationResult {
  submit: (args: { fullName: string; password: string }) => void;
  isPending: boolean;
  errorMessage: string | null;
}

export function useAcceptInvitation(token: string): UseAcceptInvitationResult {
  const endpoints = useEndpoints();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    ...acceptInvitationMutation(endpoints),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.session.all });
      navigate(ROUTES.reporting.index, { replace: true });
    },
  });

  const submit = useCallback(
    ({ fullName, password }: { fullName: string; password: string }) =>
      mutation.mutate({ token, full_name: fullName.trim(), password }),
    [mutation, token],
  );

  return {
    submit,
    isPending: mutation.isPending,
    errorMessage: mutation.error
      ? tokenErrorMessage(mutation.error, 'accept the invitation')
      : null,
  };
}
