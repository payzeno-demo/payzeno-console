/**
 * `ApiKeyDetailPage` — child route of `DevelopersPage`.
 *
 * Exists because `ResourceEndpoint.get(id)` is mandatory on all ten concretes
 * (interfaces.md §4.2), and because a developer chasing a `401 invalid_api_key` in their logs
 * has a key id and nothing else. The page answers: is this key live, is it revoked, and what
 * is it allowed to do.
