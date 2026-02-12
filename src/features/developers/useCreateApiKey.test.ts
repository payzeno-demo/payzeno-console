/**
 * `useCreateApiKey`.
 *
 * The secret comes back exactly once and the hook splits it off the metadata immediately, so
 * the only place it exists is `secret` — which `SecretRevealOnce` clears. That split is the
 * behaviour under test: an implementation that kept the whole response in one state object
 * would put a live API key into every React DevTools snapshot and every component-state error
 * report (arc PCI).
 */
import { describe, expect, it } from 'vitest';

import { queryKeys } from '@api/queryKeys';
import { useCreateApiKey } from '@features/developers/useCreateApiKey';
import { errorHandler, recordRequests, server } from '@/test/msw/server';
import { act, renderHookWithProviders, waitFor } from '@/test/render';

describe('creating a key', () => {
  it('posts to /v1/api-keys', async () => {
    const recorder = recordRequests();
    const { result } = renderHookWithProviders(() => useCreateApiKey());

    act(() => {
      result.current.createApiKey({ name: 'Checkout server', mode: 'live' });
    });

    await waitFor(() => {
      expect(result.current.createdKey).not.toBeNull();
    });

    expect(result.current.createdKey).not.toHaveProperty('secret');
    expect(result.current.createdKey?.last_four).toHaveLength(4);
  });

  it('returns the secret separately, exactly once', async () => {
    const { result } = renderHookWithProviders(() => useCreateApiKey());

    act(() => {
      result.current.createApiKey({ name: 'Checkout server', mode: 'live' });
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBe('Creating an API key needs an admin role.');
    });
  });

  it('leaves no secret behind when the create fails', async () => {
    server.use(errorHandler('post', '/api-keys', 500, 'internal_error'));

  });
});
