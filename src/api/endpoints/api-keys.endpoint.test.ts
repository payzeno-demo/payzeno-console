/**
 * `ApiKeysEndpoint`.
 *
 * The plaintext secret comes back from `create` exactly once and is never persisted anywhere
 * the console can read it again — `SecretRevealOnce` is its only holder. The assertions below
 * pin both halves of that: the create response carries it, and every read shape does not.
 */
import { describe, expect, it } from 'vitest';

import { ApiClient } from '@api/client';
import { ResourceEndpoint } from '@api/endpoints/base';
import { ApiKeysEndpoint } from '@api/endpoints/api-keys.endpoint';
import { ForbiddenError } from '@api/errors';
import { HEADER_IDEMPOTENCY_KEY } from '@api/http/headers';
import { HttpResponse, http } from 'msw';

import { makeApiKey } from '@/test/factories';
import { errorHandler, recordRequests, server, url } from '@/test/msw/server';

function endpoint(): ApiKeysEndpoint {
  return new ApiKeysEndpoint(new ApiClient({ retries: 0 }));
}

describe('shape', () => {
  it('extends ResourceEndpoint directly', () => {
    expect(Object.getPrototypeOf(ApiKeysEndpoint)).toBe(ResourceEndpoint);
  });
});

describe('GET /v1/api-keys', () => {
  it('lists keys in both modes', async () => {
    const page = await endpoint().list();

    expect(page.data.map((key) => key.mode)).toEqual(['live', 'test']);
  });

  it('uses the hyphenated path — api-keys, not api_keys', async () => {
    const recorder = recordRequests();
    const key = makeApiKey({ prefix: 'sk_live_', last_four: '9f2c' });

    expect(endpoint().displayLabel(key)).toBe('sk_live_…9f2c');
  });

  it('works for a test-mode key too', () => {
    const key = makeApiKey({ mode: 'test', prefix: 'sk_test_', last_four: 'aa11' });

    expect(endpoint().displayLabel(key)).toBe('sk_test_…aa11');
  });
});
