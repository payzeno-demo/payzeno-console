/**
 * Picks the transport and builds the endpoint registry — once.
 *
 * `?mock=1` (or `pnpm dev:mock`, which sets `__FORCE_MOCK_TRANSPORT__`) swaps `ApiClient` for
 * `MockTransport`. Both `implements HttpTransport`, both are wired here in production code,
 * and `createEndpoints()` neither knows nor cares which one it got. That is the entire reason
 * `HttpTransport` carries the full verb surface rather than just `request()`.
 *
 * The registry is memoised on the transport identity: rebuilding it on every render would
 * hand every `useQuery` a new function reference and defeat the query cache.
 */
import { useMemo } from 'react';
import type { ReactNode } from 'react';

import { ApiClient } from '@api/client';
import { createEndpoints } from '@api/endpoints/index';
import { MockTransport } from '@api/mock/mock-transport';
import type { HttpTransport } from '@api/transport';
import { runtimeConfig } from '@config/runtime';

import { ApiContext } from './ApiContext';

export interface TransportProviderProps {
  children: ReactNode;
  /** Injected by tests. When set, neither `ApiClient` nor `MockTransport` is constructed. */
  transport?: HttpTransport;
}

/**
 * Should this session run on the mock transport?
 *
 * `?mock=1` in the URL, or a build made with `pnpm dev:mock`. Exported so the sales demo
 * runbook can point at one function, and so the test can assert the precedence.
 */
export function shouldUseMock(search: string = window.location.search): boolean {
  if (runtimeConfig.forceMockTransport) return true;
  return new URLSearchParams(search).get('mock') === '1';
}

export function TransportProvider({ children, transport }: TransportProviderProps) {
  const client = useMemo<HttpTransport>(() => {
    if (transport) return transport;
    return shouldUseMock() ? new MockTransport() : new ApiClient();
  }, [transport]);

  const endpoints = useMemo(() => createEndpoints(client), [client]);

  return <ApiContext.Provider value={endpoints}>{children}</ApiContext.Provider>;
}
