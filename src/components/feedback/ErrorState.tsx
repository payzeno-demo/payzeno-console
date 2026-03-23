/**
 * Inline failure state for a region of a page — the table failed, the summary cards failed —
 * where blowing the whole route away would be disproportionate.
 *
 * It is deliberately *thinner* than `<ErrorFallback>`: the full subclass ladder lives in
 * `ErrorBoundary.tsx` and this only distinguishes the three things a merchant can act on
 * (permission, upstream, everything else). Anything richer belongs in the boundary.
 *
 * a11y: `role="status"` rather than `role="alert"`, because a failed section is not an
 * interruption — the user is still on the page and the rest of it still works.
 */
import type { ReactNode } from 'react';

import {
  ConsoleApiError,
  ForbiddenError,
  UpstreamUnavailableApiError,
  isConsoleApiError,
} from '@api/errors';
import { pz } from '@lib/cn';
import { isConsoleClientError } from '@lib/errors';

import { Button } from '../ui/Button';
import { color, font, radius, space } from '../ui/tokens';

export interface ErrorStateProps {
  error: unknown;
  /** Headline. Say what failed, in the merchant's words: "We could not load your payouts". */
  title: string;
  /** Retry handler. Omitted for failures a retry cannot fix (403). */
  onRetry?: () => void;
  /** Extra action — "Contact support", "Go back". */
  action?: ReactNode;
}

/**
 * One sentence explaining the failure. Never `error.message` for a 5xx: those are written for
 * engineers and say things like "upstream connect error or disconnect/reset before headers".
 */
export function explain(error: unknown): string {
  if (error instanceof ForbiddenError) {
    return 'Your role does not include access to this. Ask an account owner to change it.';
  }
  if (error instanceof UpstreamUnavailableApiError) {
    return 'One of our upstream providers is not responding. This usually clears in a minute.';
  }
  if (isConsoleApiError(error)) {
    if (error.status >= 500) return 'Something went wrong on our side. Retrying often works.';
    return error.message;
  }
  if (isConsoleClientError(error)) {
    return error.displayMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected problem stopped this from loading.';
}

/** Correlation id, when there is one. Support asks for it every single time. */
function referenceOf(error: unknown): string | null {
  return error instanceof ConsoleApiError ? error.requestId : null;
}

export function ErrorState({ error, title, onRetry, action }: ErrorStateProps) {
  const reference = referenceOf(error);
  const retryable = onRetry !== undefined && !(error instanceof ForbiddenError);

  return (
    <div
      role="status"
      className={pz('error-state')}
      style={{
        display: 'grid',
        gap: space[3],
        padding: space[6],
        fontFamily: font.family,
        color: color.textPrimary,
