/**
 * The **only** place a `ConsoleApiError` is rendered (interfaces.md §4.3).
 *
 * `api/http/error-mapper.ts` is the only place one is constructed; this file is the only place
 * one is turned into pixels. One branch per subclass, in status order, so that adding a tenth
 * subclass forces a visible edit here rather than silently falling into the generic fallback.
 *
 * `QueryErrorBoundary` is the variant mounted by `App.tsx`: it wires TanStack Query's
 * `QueryErrorResetBoundary` in so that "Try again" actually re-runs the failed query instead
 * of just re-rendering the same cached rejection.
 *
 * a11y (tflexbox): the fallback is `role="alert"` and takes focus on mount. A user who was
 * tabbing through a table when it exploded is otherwise left with focus on a node that no
 * longer exists.
 */
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { Component, useEffect, useRef } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

import {
  BadRequestApiError,
  ConflictApiError,
  ConsoleApiError,
  ForbiddenError,
  NotFoundApiError,
  RateLimitedApiError,
  UnauthorizedError,
  UpstreamUnavailableApiError,
  ValidationApiError,
} from '@api/errors';
import { runtimeConfig } from '@config/runtime';
import { pz } from '@lib/cn';
import { ConsoleClientError, isConsoleClientError } from '@lib/errors';
import { captureError } from '@lib/telemetry';

import { color, font, radius, space } from '../ui/tokens';

import { ErrorState } from './ErrorState';
import { NotFound } from './NotFound';
import { PermissionDenied } from './PermissionDenied';
import { RateLimitCountdown } from './RateLimitCountdown';
import { UpstreamDown } from './UpstreamDown';

export interface ErrorFallbackProps {
  error: unknown;
  /** Re-runs the failed query (or re-mounts the subtree when there is no query behind it). */
  onRetry: () => void;
}

/**
 * The switch. Exported on its own because `ErrorState` renders inline failures with exactly
 * the same branching, and two copies of this ladder is how the 429 branch went missing for a
 * month (PAY-1854).
 */
export function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const body = renderError(error, onRetry);

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className={pz('error-boundary')}
      style={{
        padding: space[6],
        fontFamily: font.family,
        color: color.textPrimary,
        background: color.surface,
        border: `1px solid ${color.border}`,
        borderRadius: radius.lg,
        outline: 'none',
      }}
    >
      {body}
    </div>
  );
}

/** One branch per subclass. Order matters: subclasses are checked before their base. */
function renderError(error: unknown, onRetry: () => void): ReactNode {
  if (error instanceof UnauthorizedError) {
    // 401 is handled by AuthProvider, which redirects to /login. If one reaches here the
    // session expired mid-render and a reload is the honest answer.
    return (
      <ErrorMessage
        title="Your session has expired"
        body="Sign in again to continue."
        actionLabel="Reload"
        onAction={() => window.location.assign('/login')}
      />
    );
  }

  if (error instanceof ForbiddenError) {
    return <PermissionDenied requestId={error.requestId} />;
  }

  if (error instanceof NotFoundApiError) {
    return <NotFound title="Not found" body="This record does not exist, or belongs to another account." />;
  }

  if (error instanceof RateLimitedApiError) {
    return <RateLimitCountdown seconds={error.retryAfter} onExpire={onRetry} />;
  }

  if (error instanceof UpstreamUnavailableApiError) {
    return <UpstreamDown onRetry={onRetry} requestId={error.requestId} />;
  }

  if (error instanceof ValidationApiError) {
    return (
      <ErrorMessage
        title="That request was rejected"
        body={error.message}
        details={error.fieldErrors.map((fieldError) => `${fieldError.path}: ${fieldError.message}`)}
        actionLabel="Try again"
        onAction={onRetry}
      />
    );
  }

  if (error instanceof ConflictApiError) {
    return (
      <ErrorMessage
        title={error.isSettlementLocked() ? 'Already being settled' : 'That changed while you were looking'}
        body={
          error.isSettlementLocked()
            ? 'A sweep is working on this batch right now. Refresh in a moment.'
            : error.message
        }
        actionLabel="Refresh"
        onAction={onRetry}
      />
    );
  }

  if (error instanceof BadRequestApiError) {
    return <ErrorMessage title="We could not process that" body={error.message} actionLabel="Try again" onAction={onRetry} />;
  }

  if (error instanceof ConsoleApiError) {
    // Covers ServerError and anything a future subclass forgets to branch for.
    return (
      <ErrorMessage
        title="Something went wrong on our side"
        body="The team has been notified. Retrying often works."
        requestId={error.requestId}
        actionLabel="Try again"
        onAction={onRetry}
      />
    );
  }

  if (isConsoleClientError(error)) {
    return (
      <ErrorMessage
        title="The console hit a problem"
        body={error.displayMessage}
        actionLabel={error.recoverable ? 'Try again' : undefined}
        onAction={error.recoverable ? onRetry : undefined}
      />
    );
  }

  return <ErrorState error={error} title="Something went wrong" onRetry={onRetry} />;
}

interface ErrorMessageProps {
  title: string;
  body: string;
  details?: ReadonlyArray<string>;
  requestId?: string;
  actionLabel?: string;
  onAction?: () => void;
}

function ErrorMessage({ title, body, details, requestId, actionLabel, onAction }: ErrorMessageProps) {
  return (
    <div style={{ display: 'grid', gap: space[3] }}>
      <h2 style={{ margin: 0, fontSize: font.size.xl, fontWeight: font.weight.semibold }}>{title}</h2>
      <p style={{ margin: 0, color: color.textSecondary }}>{body}</p>

      {details && details.length > 0 ? (
        <ul style={{ margin: 0, paddingInlineStart: space[5], color: color.textSecondary }}>
          {details.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}

      {requestId ? (
        <p style={{ margin: 0, fontFamily: font.familyMono, fontSize: font.size.sm, color: color.textMuted }}>
          Reference {requestId}
        </p>
      ) : null}

      {actionLabel && onAction ? (
        <div>
          <button
            type="button"
            onClick={onAction}
            style={{
              padding: `${space[2]} ${space[4]}`,
              fontFamily: font.family,
              fontSize: font.size.md,
              color: color.textInverse,
              background: color.brand,
              border: 'none',
              borderRadius: radius.md,
              cursor: 'pointer',
            }}
          >
            {actionLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Called after the error is reported. `QueryErrorBoundary` passes the query reset. */
  onReset?: () => void;
  /** Feature name for the telemetry tag. */
  feature?: string;
}

interface ErrorBoundaryState {
  error: unknown;
}

/**
 * The class component. React still has no hook equivalent of `componentDidCatch`, so this is
 * one of exactly two class components in the repo (the other is nothing — this is the only
 * one).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    const context: { feature?: string; code?: string; requestId?: string } = {};
    if (this.props.feature) context.feature = this.props.feature;
    if (error instanceof ConsoleApiError) {
      context.code = error.code;
      context.requestId = error.requestId;
    } else if (error instanceof ConsoleClientError) {
      context.code = error.clientCode;
    }

    captureError(error, context);
    // The component stack is genuinely useful and carries no user data. `import.meta.env` is
    // off-limits outside `config/env.ts`, so the environment comes from the runtime config.
    if (runtimeConfig.environment === 'local') console.error(error, info.componentStack);
  }

  private readonly reset = (): void => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  override render(): ReactNode {
    if (this.state.error !== null) {
      return <ErrorFallback error={this.state.error} onRetry={this.reset} />;
    }
    return this.props.children;
  }
}

/**
 * The boundary `App.tsx` mounts. Resetting it also resets every query that errored inside it,
 * which is what makes the retry button do something.
 */
export function QueryErrorBoundary({ children, feature }: { children: ReactNode; feature?: string }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset} feature={feature}>
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
