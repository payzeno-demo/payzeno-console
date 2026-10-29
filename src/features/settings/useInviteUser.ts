/**
 * Invite a team member — `POST /v1/merchants/:merchantId/users`.
 *
 * LEGACY PATH, same as `useUsers`. `api-fetch.ts` mints its own `Idempotency-Key` (a ULID per
 * call, not per attempt) and throws a bare `Error`, so:
 *  - a duplicate invite surfaces as a generic message rather than a `ConflictApiError`, and
 *  - the caller has to hand the new row back to `useUsers().reload()` because nothing here
 *    participates in query invalidation.
 *
 * TODO(rrefactor): fold into `settings.queries.ts` with the rest. PAY-1744.
 */
import { useCallback, useState } from 'react';

import type { User, UserRole } from '@payzeno/contracts';

import { apiFetch } from '@api/legacy/api-fetch';
import { isLegacyError, legacyStatus } from '@api/legacy/legacy-errors';
import { useCurrentMerchant } from '@app/SessionContext';
import { useToast } from '@app/ToastProvider';

export interface InviteUserArgs {
  email: string;
  fullName: string;
  role: UserRole;
}

export interface UseInviteUserResult {
  inviteUser: (args: InviteUserArgs) => Promise<User | null>;
  isPending: boolean;
  errorMessage: string | null;
  invitedUser: User | null;
}

/** Maps the loose `status` property the legacy thrower attaches onto a sentence. */
function messageFor(error: unknown): string {
  const status = legacyStatus(error);
  if (status === 403) return 'Inviting a team member needs the team:invite permission.';
  if (status === 409) return 'That email address is already on this account.';
  if (status === 422) return 'That email address was rejected. Check it and try again.';
  if (isLegacyError(error)) return error.message;
  return 'The invitation could not be sent. Try again in a moment.';
}

export function useInviteUser(): UseInviteUserResult {
  const merchant = useCurrentMerchant();
  const toast = useToast();

  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [invitedUser, setInvitedUser] = useState<User | null>(null);

  const inviteUser = useCallback(
    async ({ email, fullName, role }: InviteUserArgs): Promise<User | null> => {
      setIsPending(true);
      setErrorMessage(null);

      try {
        const user = await apiFetch<User>(`/merchants/${merchant.id}/users`, {
          verb: 'POST',
          payload: { email: email.trim(), full_name: fullName.trim(), role },
        });
        setInvitedUser(user);
        // RFC platform-v2 §4: the api emails a single-use `team_invite` link (72h).
        toast.success(`Invitation email sent to ${user.email}.`);
        return user;
      } catch (error: unknown) {
        setErrorMessage(messageFor(error));
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [merchant.id, toast],
  );

  return { inviteUser, isPending, errorMessage, invitedUser };
}
