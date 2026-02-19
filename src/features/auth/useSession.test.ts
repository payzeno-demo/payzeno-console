/**
 * `useSession` — the bootstrap read every other query sits behind.
 *
 * The important distinction: a 401 from `GET /v1/auth/me` is **not signed in**, which is a
 * normal state, and must not surface as an error or be retried. Everything else is a genuine
 * failure and must surface, because a console that renders an empty dashboard when the API is
 * down is worse than one that says so.
 */
import { describe, expect, it } from 'vitest';

import { useSession } from '@features/auth/useSession';
import { makeSession } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';
import { renderHookWithProviders, waitFor } from '@/test/render';

import { HttpResponse, http } from 'msw';

describe('a signed-in session', () => {
  it('reads GET /v1/auth/me', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => useSession(), { session: null });

    await waitFor(() => {
      expect(result.current.session).toBeDefined();
    });

    const request = recorder.requests.find((candidate) => candidate.url.endsWith('/auth/me'));
    recorder.stop();

    expect(request?.method).toBe('GET');
  });

  it('exposes the user and the merchant separately, as the shell needs them', async () => {
    const { result } = renderHookWithProviders(() => useSession(), { session: null });

    await waitFor(() => {
      expect(result.current.user).toBeDefined();
    });

    expect(result.current.user?.email).toBe('finance@northwind.example');
    expect(result.current.merchant?.display_name).toBe('Northwind');
  });

  it('exposes the resolved permission list', async () => {
    const { result } = renderHookWithProviders(() => useSession(), { session: null });

    await waitFor(() => {
      expect(result.current.permissions.length).toBeGreaterThan(0);
    });

    expect(result.current.permissions).toContain('settlements:retry');
  });

  it('reports neither loading nor signed-out once resolved', async () => {
    const { result } = renderHookWithProviders(() => useSession(), { session: null });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSignedOut).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe('not signed in', () => {
  it('reports isSignedOut on a 401', async () => {
    server.use(errorHandler('get', '/auth/me', 401, 'authentication_required'));

    const { result } = renderHookWithProviders(() => useSession(), { session: null });

    await waitFor(() => {
      expect(result.current.isSignedOut).toBe(true);
    });
  });

  it('does not present the 401 as an error — it is a state, not a fault', async () => {
    server.use(errorHandler('get', '/auth/me', 401, 'authentication_required'));

    const { result } = renderHookWithProviders(() => useSession(), { session: null });

    await waitFor(() => {
      expect(result.current.isSignedOut).toBe(true);
    });
    expect(result.current.error).toBeNull();
  });

  it('leaves the session, user and merchant undefined', async () => {
    server.use(errorHandler('get', '/auth/me', 401, 'authentication_required'));

    const { result } = renderHookWithProviders(() => useSession(), { session: null });

    await waitFor(() => {
      expect(result.current.isSignedOut).toBe(true);
    });

    expect(result.current.session).toBeUndefined();
    expect(result.current.user).toBeUndefined();
    expect(result.current.permissions).toEqual([]);
  });

  it('does not retry a 401', async () => {
    let calls = 0;
    server.use(
      http.get(url('/auth/me'), () => {
        calls += 1;
        return HttpResponse.json(
          { error: { code: 'authentication_required', message: 'no', request_id: 'r' } },
          { status: 401 },
        );
      }),
    );

    const { result } = renderHookWithProviders(() => useSession(), { session: null });

    await waitFor(() => {
      expect(result.current.isSignedOut).toBe(true);
    });
    expect(calls).toBe(1);
  });
});

describe('a real failure', () => {
  it('surfaces a 500 as an error rather than as a sign-out', async () => {
    server.use(errorHandler('get', '/auth/me', 500, 'internal_error', 'Boom'));

    const { result } = renderHookWithProviders(() => useSession(), { session: null });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });
    expect(result.current.isSignedOut).toBe(false);
  });
});

describe('refetch', () => {
  it('re-reads the session, which is how a role change lands without a reload', async () => {
    let calls = 0;
    server.use(
      http.get(url('/auth/me'), () => {
        calls += 1;
        return HttpResponse.json(
          makeSession(calls > 1 ? { permissions: ['payments:read'] } : {}),
        );
      }),
    );

    const { result } = renderHookWithProviders(() => useSession(), { session: null });

    await waitFor(() => {
      expect(result.current.permissions.length).toBeGreaterThan(1);
    });

    result.current.refetch();

    await waitFor(() => {
      expect(result.current.permissions).toEqual(['payments:read']);
    });
  });
});
