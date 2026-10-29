/**
 * Inline failure for an admin query.
 *
 * Three cases the shared `<ErrorState>` would get wrong for staff:
 *  - 401: the staff session expired mid-page. Ask the bootstrap to re-check, which makes
 *    `StaffAuthProvider` redirect to `/login`; never navigate from here.
 *  - 403: the api disagrees with our role table. Staff wording, not "ask an account owner".
 *  - everything else: the shared `<ErrorState>`, retry included.
 */
import { useEffect } from 'react';

import { ForbiddenError, UnauthorizedError } from '@api/errors';
import { ErrorState } from '@components/feedback/ErrorState';

import { useStaffSessionState } from '../app/StaffSessionContext';

import { StaffAccessDenied } from './StaffAccessDenied';

export interface AdminQueryErrorProps {
  error: unknown;
  /** "We could not load merchants". */
  title: string;
  /** For the 403 copy: "risk reviews". */
  what: string;
  onRetry?: () => void;
}

export function AdminQueryError({ error, title, what, onRetry }: AdminQueryErrorProps) {
  const { refresh, staff } = useStaffSessionState();
  const expired = error instanceof UnauthorizedError;

  useEffect(() => {
    if (expired) refresh();
  }, [expired, refresh]);

  if (expired) {
    return <ErrorState error={error} title="Your staff session has expired" />;
  }

  if (error instanceof ForbiddenError) {
    return <StaffAccessDenied what={what} role={staff?.role ?? null} requestId={error.requestId} />;
  }

  return <ErrorState error={error} title={title} onRetry={onRetry} />;
}
