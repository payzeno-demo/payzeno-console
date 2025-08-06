/**
 * `useApiKey(id)` — `GET /v1/api-keys/:apiKeyId` (api-surface.md §12).
 *
 * The response never contains the secret — only the prefix and last four. If you are reading
 * this because a merchant lost their key: there is no recovery path by design. They rotate.
