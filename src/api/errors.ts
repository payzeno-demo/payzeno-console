/**
 * The console's HTTP error hierarchy — interfaces.md §4.3, frozen.
 *
 * `ConsoleApiError extends PayzenoError` from `@payzeno/contracts`, which is what makes the
 * inheritance chain cross a repo boundary. Every subclass below exists even when it is
