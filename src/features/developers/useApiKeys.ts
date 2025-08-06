/**
 * `useApiKeys()` — `GET /v1/api-keys` (api-surface.md §12).
 *
 * Live and revoked keys come back in one list; the console splits them, because a revoked key
 * is history and mixing the two is how someone rotates the key that is still in production.
