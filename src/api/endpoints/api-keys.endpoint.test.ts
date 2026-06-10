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
    await endpoint().list();

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.url).toContain('/v1/api-keys');
  });

  it('never returns a plaintext secret on a read', async () => {
    const page = await endpoint().list();

    for (const key of page.data) {
      expect(key).not.toHaveProperty('secret');
      expect(key.last_four).toHaveLength(4);
    }
  });
});

describe('GET /v1/api-keys/:apiKeyId', () => {
  it('reads one key by id', async () => {
    const key = await endpoint().get('key_01HW0RTAPIKEY000000001');

    expect(key.id).toBe('key_01HW0RTAPIKEY000000001');
    expect(key).not.toHaveProperty('secret');
  });
});

describe('POST /v1/api-keys', () => {
  it('creates a key and returns the plaintext secret exactly once', async () => {
    const recorder = recordRequests();
    const created = await endpoint().create({ name: 'Checkout server', mode: 'live' });

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.method).toBe('POST');
    expect(request?.url).toBe('http://localhost/v1/api-keys');
    expect(created.name).toBe('Checkout server');
    expect(created.secret).toBe('sk_live_01HW0RTAPIKEYCREATED01_shown_once');
  });

  it('sends an idempotency key so a double submit does not mint two keys', async () => {
    const recorder = recordRequests();
    await endpoint().create({ name: 'Batch worker', mode: 'test' }, 'create-key-attempt-1');

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.headers.get(HEADER_IDEMPOTENCY_KEY)).toBe('create-key-attempt-1');
  });

  it('surfaces a 403 for a developer-role session', async () => {
    server.use(errorHandler('post', '/api-keys', 403, 'permission_denied'));

    await expect(endpoint().create({ name: 'x', mode: 'test' })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});

describe('DELETE /v1/api-keys/:apiKeyId', () => {
  it('revokes a key and resolves with nothing', async () => {
    // §9 has no DELETE fixture in the default handler set — revocation is the one write the
    // demo dataset must not perform — so the case registers it for itself.
    server.use(
      http.delete(url('/api-keys/:apiKeyId'), () => new HttpResponse(null, { status: 204 })),
    );

    const recorder = recordRequests();
    await expect(endpoint().revoke('key_01HW0RTAPIKEY000000002')).resolves.toBeUndefined();

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.method).toBe('DELETE');
    expect(request?.url).toBe('http://localhost/v1/api-keys/key_01HW0RTAPIKEY000000002');
    expect(request?.headers.get(HEADER_IDEMPOTENCY_KEY)).toBeTruthy();
  });
});

describe('displayLabel', () => {
  it('joins the prefix and last four with an ellipsis, never the middle', () => {
    const key = makeApiKey({ prefix: 'sk_live_', last_four: '9f2c' });

    expect(endpoint().displayLabel(key)).toBe('sk_live_…9f2c');
  });

  it('works for a test-mode key too', () => {
    const key = makeApiKey({ mode: 'test', prefix: 'sk_test_', last_four: 'aa11' });

    expect(endpoint().displayLabel(key)).toBe('sk_test_…aa11');
  });
});
