/**
 * The endpoint registry, over context.
 *
 * This is the seam that makes `?mock=1` work. `TransportProvider` builds the registry exactly
 * once, from either `ApiClient` or `MockTransport`, and every `<f>.queries.ts` receives it as
 * an argument. No feature ever imports `ApiClient`, and no feature branches on mock mode.
 *
 * `useEndpoints()` throws rather than returning `null` when there is no provider: a hook that
 * silently returns undefined turns into "cannot read property list of undefined" three frames
 * away, and the fix is always the same missing provider.
 */
import { createContext, useContext } from 'react';

import type { EndpointRegistry } from '@api/endpoints/index';
import { assertProvider } from '@lib/assert';

export const ApiContext = createContext<EndpointRegistry | null>(null);

ApiContext.displayName = 'ApiContext';

/**
 * The registry for the current transport.
 *
 * @throws {InvariantViolation} when called outside `<TransportProvider>`.
 */
export function useEndpoints(): EndpointRegistry {
  return assertProvider(useContext(ApiContext), 'TransportProvider');
}

/**
 * One endpoint, by name. Marginally nicer at a call site that only needs one
 * (`const settlements = useEndpoint('settlements')`) and it keeps the generic narrow.
 */
export function useEndpoint<TName extends keyof EndpointRegistry>(
  name: TName,
): EndpointRegistry[TName] {
  return useEndpoints()[name];
}

/**
 * Non-throwing read, for the two components that render before the provider mounts
 * (`<EnvironmentBanner />` on the login page, and the error boundary's fallback).
 */
export function useOptionalEndpoints(): EndpointRegistry | null {
  return useContext(ApiContext);
}
