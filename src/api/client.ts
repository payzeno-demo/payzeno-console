/**
 * `ApiClient` — the console's one HTTP client against payzeno-api.
 *
 * It implements `HttpTransport` (interfaces.md §4.2) so that `TransportProvider` can hand
 * `MockTransport` to exactly the same endpoint registry under `?mock=1`.
 *
