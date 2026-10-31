/**
 * One sentence for a failed emailed-link flow (verify, accept invite, reset password).
 *
 * payzeno-api answers a bad link with `400 invalid_request` and `details.reason` of
 * `token_expired` or `token_invalid` (spent, or never issued). Expired gets its own sentence,
 * because the fix is different: ask for a fresh link rather than check the one you have.
 */
import { ConsoleApiError, ValidationApiError } from '@api/errors';

export function tokenFailureReason(error: unknown): 'expired' | 'invalid' | null {
  if (!(error instanceof ConsoleApiError)) return null;
  const reason = error.details.reason;
  if (reason === 'token_expired') return 'expired';
  if (reason === 'token_invalid') return 'invalid';
  return null;
}

export function tokenErrorMessage(error: unknown, action: string): string {
  if (error instanceof ValidationApiError && error.fieldErrors.some((fe) => fe.path !== 'token')) {
    return error.fieldErrors.map((fe) => fe.message).join(' ');
  }
  const reason = tokenFailureReason(error);
  if (reason === 'expired') {
    return `This link has expired, so we could not ${action}. Links only work for a limited time — ask for a new one.`;
  }
  if (error instanceof ConsoleApiError && error.status >= 400 && error.status < 500) {
    return `This link is invalid or has already been used, so we could not ${action}. Ask for a new one.`;
  }
  return `We could not ${action} just now. Try again in a moment.`;
}
