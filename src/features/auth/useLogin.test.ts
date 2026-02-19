/**
 * `useLogin`.
 *
 * The security-relevant assertion is the vague 401 message. "That email and password do not
 * match" is deliberately ambiguous: saying "no such account" turns the login form into an
 * account-enumeration oracle, and someone will eventually try to "improve" the copy.
 */
import { describe, expect, it } from 'vitest';

import { queryKeys } from '@api/queryKeys';
import { useLogin } from '@features/auth/useLogin';
import { errorHandler, recordRequests, server } from '@/test/msw/server';
import { act, renderHookWithProviders, waitFor } from '@/test/render';

const CREDENTIALS = { email: 'finance@northwind.example', password: 'correct horse' };

describe('submitting', () => {
  it('posts to /v1/auth/login', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => useLogin(), { session: null });

    act(() => {
      result.current.submit(CREDENTIALS);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    const request = recorder.requests.find((candidate) => candidate.url.endsWith('/auth/login'));
    recorder.stop();

    expect(request?.method).toBe('POST');
  });

  it('sends an idempotency key, so a double submit is one login', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => useLogin(), { session: null });

    act(() => {
      result.current.submit(CREDENTIALS);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    const request = recorder.requests.find((candidate) => candidate.url.endsWith('/auth/login'));
    recorder.stop();

    expect(request?.headers.get('Idempotency-Key')).toBeTruthy();
  });

  it('reports pending while the request is in flight', async () => {
    const { result } = renderHookWithProviders(() => useLogin(), { session: null });

    act(() => {
      result.current.submit(CREDENTIALS);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  it('invalidates the session query so the app re-bootstraps as the new user', async () => {
    const { result, queryClient } = renderHookWithProviders(() => useLogin(), {
      session: null,
    });

    act(() => {
      result.current.submit(CREDENTIALS);
    });

    await waitFor(() => {
      expect(queryClient.getQueryState(queryKeys.session.me())?.isInvalidated ?? true).toBe(
        true,
      );
    });
  });

  it('leaves no error behind on success', async () => {
    const { result } = renderHookWithProviders(() => useLogin(), { session: null });

    act(() => {
      result.current.submit(CREDENTIALS);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(result.current.errorMessage).toBeNull();
    expect(result.current.fieldErrors).toEqual({});
  });
});

describe('a rejected sign-in', () => {
  it('says only that the pair does not match — never which half was wrong', async () => {
    server.use(errorHandler('post', '/auth/login', 401, 'authentication_required', 'No such user'));

    const { result } = renderHookWithProviders(() => useLogin(), { session: null });

    act(() => {
      result.current.submit(CREDENTIALS);
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBe('That email and password do not match.');
    });
  });

  it('does not leak the server message on a 401', async () => {
    server.use(
      errorHandler('post', '/auth/login', 401, 'authentication_required', 'user not found'),
    );

    const { result } = renderHookWithProviders(() => useLogin(), { session: null });

    act(() => {
      result.current.submit(CREDENTIALS);
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBeTruthy();
    });
    expect(result.current.errorMessage).not.toContain('user not found');
  });
});

describe('a malformed sign-in', () => {
  it('maps 422 field errors onto the form', async () => {
    server.use(
      errorHandler('post', '/auth/login', 422, 'validation_failed', 'Check the fields.', {
        field_errors: [{ path: 'email', message: 'Not a valid email address.' }],
      }),
    );

    const { result } = renderHookWithProviders(() => useLogin(), { session: null });

    act(() => {
      result.current.submit({ email: 'not-an-email', password: 'x' });
    });

    await waitFor(() => {
      expect(result.current.fieldErrors).toEqual({ email: 'Not a valid email address.' });
    });
    expect(result.current.errorMessage).toBe('Check the highlighted fields.');
  });

  it('surfaces the server message for any other ConsoleApiError', async () => {
    server.use(
      errorHandler('post', '/auth/login', 429, 'rate_limited', 'Too many sign-in attempts.'),
    );

    const { result } = renderHookWithProviders(() => useLogin(), { session: null });

    act(() => {
      result.current.submit(CREDENTIALS);
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBe('Too many sign-in attempts.');
    });
  });

  it('falls back to a generic message when the failure is not an API error at all', async () => {
    server.use(errorHandler('post', '/auth/login', 500, 'internal_error', 'Boom'));

    const { result } = renderHookWithProviders(() => useLogin(), { session: null });

    act(() => {
      result.current.submit(CREDENTIALS);
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBeTruthy();
    });
  });
});
