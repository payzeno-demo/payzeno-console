/**
 * Query/mutation factories for `features/developers`. The ONLY caller of `ApiKeysEndpoint`,
 * `WebhookEventsEndpoint` and `WebhookEndpointsEndpoint`.
 *
 * One rule dominates this file: **the plaintext API key secret never enters the query cache.**
 * `POST /v1/api-keys` returns it exactly once, `SecretRevealOnce` holds it in component state,
 * and the create mutation deliberately does not write it back into any key. A secret in the
 * cache is a secret in a devtools snapshot.
 */
import { queryOptions } from '@tanstack/react-query';
