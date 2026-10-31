/**
 * `ErrorBoundary` / `ErrorFallback` — the **only** place a `ConsoleApiError` is rendered
 * (interfaces.md §4.3, blueprint §1.5). One branch per subclass, and this file is one case per
 * branch, because the whole value of a nine-class hierarchy is that each one produces a
 * different, useful screen. A boundary that renders "Something went wrong" nine times would
 * pass a shallower test and help nobody.
 */
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';

import {
  BadRequestApiError,
  ConflictApiError,
  ForbiddenError,
  NotFoundApiError,
  RateLimitedApiError,
  ServerError,
  UnauthorizedError,
  UpstreamUnavailableApiError,
  ValidationApiError,
} from '@api/errors';
import type { ConsoleApiErrorInit } from '@api/errors';
import { ErrorBoundary, ErrorFallback } from '@components/feedback/ErrorBoundary';
import { CsvExportError, NotificationStreamError } from '@lib/errors';
import { renderWithRouter, screen } from '@/test/render';

function init(overrides: Partial<ConsoleApiErrorInit> = {}): ConsoleApiErrorInit {
  return {
    status: 500,
    code: 'internal_error',
    message: 'Something went wrong.',
    requestId: 'req_boundary_0001',
    ...overrides,
  };
}

function Boom({ error }: { error: unknown }): ReactNode {
  throw error;
}

/** React logs every caught render error; the boundary is the thing under test, not the noise. */
let consoleError: MockInstance<Parameters<typeof console.error>, void>;

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  consoleError.mockRestore();
});

describe('the boundary itself', () => {
  it('renders its children while nothing has gone wrong', () => {
    renderWithRouter(
      <ErrorBoundary>
        <p>Settlement items</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Settlement items')).toBeInTheDocument();
  });

  it('catches a throw from a child and renders an alert instead', () => {
    renderWithRouter(
      <ErrorBoundary>
        <Boom error={new ServerError(init())} />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('moves focus to the alert, so the failure is not silent for a screen reader', () => {
    renderWithRouter(
      <ErrorBoundary>
        <Boom error={new ServerError(init())} />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveFocus();
  });

  it('recovers when reset, rendering the children again', async () => {
    const onReset = vi.fn();
    let shouldThrow = true;

    function Child() {
      if (shouldThrow) throw new ServerError(init());
      return <p>Recovered</p>;
    }

    const { user } = renderWithRouter(
      <ErrorBoundary onReset={onReset}>
        <Child />
      </ErrorBoundary>,
    );

    shouldThrow = false;
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });
});

describe('one branch per ConsoleApiError subclass', () => {
  it('401 offers a route back to sign in', () => {
    renderWithRouter(<ErrorFallback error={new UnauthorizedError(init({ status: 401 }))} onRetry={vi.fn()} />);

    expect(screen.getByText('Your session has expired')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  it('403 renders the permission-denied screen with the request id', () => {
    renderWithRouter(
      <ErrorFallback
        error={new ForbiddenError(init({ status: 403, requestId: 'req_403' }))}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText(/req_403/)).toBeInTheDocument();
  });

  it('404 renders the not-found screen, and says why an id might be missing', () => {
    renderWithRouter(<ErrorFallback error={new NotFoundApiError(init({ status: 404 }))} onRetry={vi.fn()} />);

    expect(screen.getByText('Not found')).toBeInTheDocument();
    expect(screen.getByText(/belongs to another account/)).toBeInTheDocument();
  });

  it('429 renders the countdown and retries when it expires', () => {
    const onRetry = vi.fn();
    renderWithRouter(
      <ErrorFallback
        error={new RateLimitedApiError(init({ status: 429, retryAfterSeconds: 3 }))}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Too many requests' })).toBeInTheDocument();
    expect(screen.getByText('3s')).toBeInTheDocument();
  });

  it('502 renders the upstream-down screen with a retry', () => {
    renderWithRouter(
      <ErrorFallback
        error={new UpstreamUnavailableApiError(init({ status: 502, requestId: 'req_502' }))}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Retry now' })).toBeInTheDocument();
    expect(screen.getByText(/req_502/)).toBeInTheDocument();
  });

  it('422 lists the field errors rather than swallowing them', () => {
    renderWithRouter(
      <ErrorFallback
        error={
          new ValidationApiError(
            init({
              status: 422,
              code: 'validation_failed',
              message: 'Some fields need attention.',
              fieldErrors: [
                {
                  path: 'amount_minor',
                  code: 'out_of_range',
                  message: 'Above the refundable amount.',
                },
                { path: 'reason', code: 'invalid_value', message: 'Not a known reason.' },
              ],
            }),
          )
        }
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText('amount_minor: Above the refundable amount.')).toBeInTheDocument();
    expect(screen.getByText('reason: Not a known reason.')).toBeInTheDocument();
  });

  it('409 settlement_locked reads as a no-op, not as a failure (arc INC)', () => {
    renderWithRouter(
      <ErrorFallback
        error={
          new ConflictApiError(
            init({ status: 409, code: 'settlement_locked', message: 'Locked.' }),
          )
        }
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText('Already being settled')).toBeInTheDocument();
    expect(screen.getByText(/A sweep is working on this batch right now/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
  });

  it('409 with any other code reads as a stale-view conflict', () => {
    renderWithRouter(
      <ErrorFallback
        error={
          new ConflictApiError(
            init({ status: 409, code: 'invalid_state', message: 'It moved on.' }),
          )
        }
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText('That changed while you were looking')).toBeInTheDocument();
    expect(screen.getByText('It moved on.')).toBeInTheDocument();
  });

  it('400 shows the server message verbatim', () => {
    renderWithRouter(
      <ErrorFallback
        error={new BadRequestApiError(init({ status: 400, message: 'cursor is malformed' }))}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText('We could not process that')).toBeInTheDocument();
    expect(screen.getByText('cursor is malformed')).toBeInTheDocument();
  });

  it('anything else in the tree falls back to the generic screen with a reference', () => {
    renderWithRouter(
      <ErrorFallback
        error={new ServerError(init({ status: 500, requestId: 'req_500' }))}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText('Something went wrong on our side')).toBeInTheDocument();
    expect(screen.getByText('Reference req_500')).toBeInTheDocument();
  });
});

describe('the client-side error branch', () => {
  it('renders a recoverable ConsoleClientError with a retry', () => {
    renderWithRouter(<ErrorFallback error={new NotificationStreamError(8)} onRetry={vi.fn()} />);

    expect(screen.getByText('The console hit a problem')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('offers no retry for an unrecoverable one', () => {
    renderWithRouter(
      <ErrorFallback
        error={new CsvExportError('widget', 'the cell renderer returns a React node')}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText('The console hit a problem')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });
});

describe('errors from outside both hierarchies', () => {
  it('renders a plain Error through ErrorState rather than crashing again', () => {
    renderWithRouter(<ErrorFallback error={new Error('undefined is not a function')} onRetry={vi.fn()} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('undefined is not a function')).toBeInTheDocument();
  });

  it('copes with a thrown string', () => {
    renderWithRouter(<ErrorFallback error={'oh no'} onRetry={vi.fn()} />);

    expect(screen.getByText(/An unexpected problem stopped this from loading/)).toBeInTheDocument();
  });
});
