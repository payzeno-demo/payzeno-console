/**
 * One sentence for a failed staff action, from the `ConsoleApiError` subclass.
 *
 * Shared by every admin mutation hook so a 403 reads the same on every page, and so the 401 case
 * is recognisable to the caller (which then asks the bootstrap to re-check the session).
 */
import {
  ConflictApiError,
  ConsoleApiError,
  ForbiddenError,
  RateLimitedApiError,
  UnauthorizedError,
  ValidationApiError,
} from '@api/errors';

export interface DescribeOptions {
  /** "approving merchants needs the risk role." */
  forbidden: string;
  /** Wording for a 409 that is not otherwise special — "This review was already decided." */
  conflict?: string;
}

export function isSessionExpired(error: unknown): boolean {
  return error instanceof UnauthorizedError;
}

export function describeMutationError(error: unknown, options: DescribeOptions): string {
  if (error instanceof UnauthorizedError) {
    return 'Your staff session has expired. Sign in again to continue.';
  }
  if (error instanceof ForbiddenError) {
    // payzeno-api names the roles a staff route needs in `details.required_roles`.
    // A string ("finance") today; a list is accepted too.
    const required = error.details['required_roles'];
    const roles = Array.isArray(required) ? required.map(String) : typeof required === 'string' ? [required] : [];
    if (roles.length > 0) {
      return `Payzeno refused this: it needs the ${roles.join(' or ')} role.`;
    }
    return `Payzeno refused this: ${options.forbidden}`;
  }
  if (error instanceof ValidationApiError) {
    const first = error.fieldErrors[0];
    return first ? `${first.message} (${first.path})` : error.message;
  }
  if (error instanceof ConflictApiError) {
    return options.conflict ? `${options.conflict} ${error.message}` : error.message;
  }
  if (error instanceof RateLimitedApiError) {
    return `Too many requests. Try again in ${error.retryAfter} seconds.`;
  }
  if (error instanceof ConsoleApiError) {
    return error.status >= 500
      ? `Something went wrong on our side (reference ${error.requestId}). Try again.`
      : error.message;
  }
  return 'The request could not be sent. Check your connection and try again.';
}
