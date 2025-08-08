/**
 * One MSW handler per api-surface.md §12 route.
 *
 * This file is what makes a hook test a real test. A hook mocked at the endpoint boundary
 * asserts that we called a function; a hook driven through here asserts that `usePayouts` →
 * `payouts.queries.ts` → `PayoutsEndpoint.list` → `ApiClient.get` → `ApiClient.request` →
 * `buildRequest` → `fetchTransport` produced `GET /v1/payouts?limit=25` and that the shape
 * coming back is the one `@payzeno/contracts` declares. Every frame in that chain is real.
 *
 * The base URL is `VITE_PAYZENO_API_URL` as set by `src/test/setup.ts`. Paths below are
 * version-free relative to it, exactly as the endpoint classes build them.
 *
 * Conventions:
 *  - handlers are permissive about query parameters and strict about paths, because the paths
 *    are the frozen contract and the parameters are not;
 *  - anything a test wants to fail is overridden per-case with `server.use(...)`, never by
 *    branching in here. A handler with an `if (shouldFail)` is a handler nobody can read.
 */
import { HttpResponse, http } from 'msw';

import type { Paginated } from '@payzeno/contracts';

import {
  makeApiKey,
