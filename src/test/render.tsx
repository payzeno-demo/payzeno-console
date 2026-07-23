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

import { ApiClient } from '@api/client';
import { createEndpoints } from '@api/endpoints/index';
import type { EndpointRegistry } from '@api/endpoints/index';
import type { HttpTransport } from '@api/transport';
import { AuthProvider } from '@app/AuthProvider';
import { FlagsProvider } from '@app/FlagsProvider';
import { NotificationProvider } from '@app/NotificationProvider';
import { QueryProvider } from '@app/QueryProvider';
import { ToastProvider } from '@app/ToastProvider';
import { TransportProvider } from '@app/TransportProvider';
import { TooltipProvider } from '@components/ui/Tooltip';
import type { FlagName } from '@lib/flags';
import type { ConsoleSession } from '@/types/session';

import { makeConsoleSession } from './factories';

export interface ProviderOptions {
  /** Initial URL. Use the real path — `ROUTES.settlements.detail(id)` — not a template. */
  route?: string;
  /**
   * Register the tree under a route pattern so `useParams()` resolves. Without it a detail
   * page renders with `params.batchId === undefined` and asserts nothing interesting.
   */
  path?: string;
  /** Swap the transport. Omit for the real `ApiClient` against MSW. */
  transport?: HttpTransport;
  /**
   * Seed the session synchronously. Defaults to the owner session from `factories.ts`; pass
   * `null` to render the signed-out tree.
   */
  session?: ConsoleSession | null;
  flags?: Partial<Record<FlagName, boolean>>;
  queryClient?: QueryClient;
}

export type RenderOptionsWithProviders = ProviderOptions & Omit<RenderOptions, 'wrapper'>;

export interface ProvidersProps extends ProviderOptions {
  children: ReactNode;
}

/** Production query defaults minus the retries. See the file header for why. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Number.POSITIVE_INFINITY,
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      mutations: { retry: false },
    },
  });
}

/**
 * The registry a test asserts against directly (`endpoints.settlements.retryItem(…)`), built
 * over the same transport a render would use.
 */
export function createTestEndpoints(transport: HttpTransport = new ApiClient()): EndpointRegistry {
  return createEndpoints(transport);
}

/** The whole stack, with a `MemoryRouter` outside it and an optional route pattern inside. */
export function Providers({
  children,
  route = '/',
  path,
  transport,
  session = makeConsoleSession(),
  flags,
  queryClient,
}: ProvidersProps) {
  const body = path ? (
    <Routes>
      <Route path={path} element={<>{children}</>} />
    </Routes>
  ) : (
    children
  );

  return (
    <MemoryRouter initialEntries={[route]}>
      <FlagsProvider overrides={flags}>
        <QueryProvider client={queryClient ?? createTestQueryClient()}>
          <TransportProvider transport={transport ?? new ApiClient()}>
            <ToastProvider>
              <AuthProvider initialSession={session ?? undefined}>
                <NotificationProvider>
                  <TooltipProvider>{body}</TooltipProvider>
                </NotificationProvider>
              </AuthProvider>
            </ToastProvider>
          </TransportProvider>
        </QueryProvider>
      </FlagsProvider>
    </MemoryRouter>
  );
}

export interface RenderWithProvidersResult extends RenderResult {
  /** Pre-bound `userEvent`, so no case forgets `userEvent.setup()`. */
  user: UserEvent;
  queryClient: QueryClient;
}

/**
 * Render `ui` inside the whole console stack.
 *
 * ```tsx
 * const { user } = renderWithProviders(<SettlementDetailPage />, {
 *   route: ROUTES.settlements.detail('sb_01HW0RTBATCH000000001'),
 *   path: '/settlements/:batchId',
 * });
 * await user.click(await screen.findByRole('button', { name: /retry/i }));
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderOptionsWithProviders = {},
): RenderWithProvidersResult {
  const { route, path, transport, session, flags, queryClient, ...renderOptions } = options;
  const client = queryClient ?? createTestQueryClient();

  const result = render(ui, {
    ...renderOptions,
    wrapper: ({ children }) => (
      <Providers
        route={route}
        path={path}
        transport={transport}
        session={session}
        flags={flags}
        queryClient={client}
      >
        {children}
      </Providers>
    ),
  });

  return { ...result, user: userEvent.setup(), queryClient: client };
}

export interface RenderHookWithProvidersResult<TResult, TProps>
  extends RenderHookResult<TResult, TProps> {
  queryClient: QueryClient;
}

/**
 * `renderHook` through the same stack. This is how every `use*.test.ts` drives a contracted
 * hook against MSW rather than against a mocked endpoint object.
 */
export function renderHookWithProviders<TResult, TProps>(
  hook: (props: TProps) => TResult,
  options: RenderOptionsWithProviders & Omit<RenderHookOptions<TProps>, 'wrapper'> = {},
): RenderHookWithProvidersResult<TResult, TProps> {
  const { route, path, transport, session, flags, queryClient, ...hookOptions } = options;
  const client = queryClient ?? createTestQueryClient();

  const result = renderHook(hook, {
    ...(hookOptions as Omit<RenderHookOptions<TProps>, 'wrapper'>),
    wrapper: ({ children }) => (
      <Providers
        route={route}
        path={path}
        transport={transport}
        session={session}
        flags={flags}
        queryClient={client}
      >
        {children}
      </Providers>
    ),
  });

  return { ...result, queryClient: client };
}

/**
 * Render a primitive with no providers — for `components/ui/**`, where a provider stack would
 * only hide a missing prop. The tooltip provider stays because `IconButton` mounts one
 * unconditionally.
 */
export function renderBare(ui: ReactElement, options: Omit<RenderOptions, 'wrapper'> = {}) {
  return {
    ...render(<TooltipProvider>{ui}</TooltipProvider>, options),
    user: userEvent.setup(),
  };
}

/** Render inside a router only — for `<Link>`-bearing components that need nothing else. */
export function renderWithRouter(
  ui: ReactElement,
  route = '/',
  options: Omit<RenderOptions, 'wrapper'> = {},
) {
  return {
    ...render(ui, {
      ...options,
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={[route]}>
