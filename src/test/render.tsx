/**
 * `renderWithProviders` — the console's test-side hub (tests.md §2.3).
 *
 * Roughly sixty test files import this one, which is deliberate: a test that assembles its
 * own provider stack is a test that keeps compiling after the real stack changes and quietly
 * stops proving anything.
 *
 * What is real here and what is not:
 *  - **Real:** the transport. The default is a live `ApiClient`, so a render runs
 *    hook → `<f>.queries.ts` → endpoint → `ApiClient.request` → `buildRequest` →
 *    `fetchTransport` → `fetch`, and MSW answers at the socket. Every frame executes.
 *  - **Real:** the six providers, in `AppProviders`' order, the query cache, the router, the
 *    toast host.
 *  - **Faked:** the notification WebSocket (`FakeWebSocket`, installed in `setup.ts`) and,
 *    where a case asks for it, time.
 *
 * ### Why the stack is composed here rather than through `<AppProvidersWithoutRouter>`
 *
 * `QueryProvider` takes a `client` prop; `AppProviders` does not forward one, because
 * production has no reason to inject a cache. Tests do: `createQueryClient()`'s production
 * retry policy repeats an `UpstreamUnavailableApiError` three times with a 1s/2s/4s backoff,
 * which turns a one-line 502 assertion into a seven-second test. So the order below is
 * duplicated from `AppProviders.tsx` on purpose, and it must be kept in step with it —
 * the same wart `AppProviders` records as TODO(rrefactor) PAY-2011. The retry policy itself is
 * covered directly against `shouldRetry` / `retryDelayFor`, so nothing goes untested.
 */
import { QueryClient } from '@tanstack/react-query';
import { render, renderHook } from '@testing-library/react';
import type {
  RenderHookOptions,
  RenderHookResult,
  RenderOptions,
  RenderResult,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

