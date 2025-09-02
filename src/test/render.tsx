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
