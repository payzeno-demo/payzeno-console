/**
 * `DisputesEndpoint` — list, get, and the evidence POST that has a deadline attached to it.
 */
import { describe, expect, it } from 'vitest';

import { ApiClient } from '@api/client';
import { ResourceEndpoint } from '@api/endpoints/base';
import { DisputesEndpoint } from '@api/endpoints/disputes.endpoint';
import { ForbiddenError, ValidationApiError } from '@api/errors';
import { HEADER_IDEMPOTENCY_KEY } from '@api/http/headers';
import { errorHandler, recordRequests, server } from '@/test/msw/server';

function endpoint(): DisputesEndpoint {
  return new DisputesEndpoint(new ApiClient({ retries: 0 }));
}

describe('shape', () => {
  it('extends ResourceEndpoint directly', () => {
    expect(Object.getPrototypeOf(DisputesEndpoint)).toBe(ResourceEndpoint);
  });
});

describe('GET /v1/disputes', () => {
  it('lists disputes with their evidence deadline intact', async () => {
    const page = await endpoint().list();

    expect(page.data).toHaveLength(2);
    expect(page.data[0]?.evidence_due_by).toBe('2026-03-21T23:59:59.000Z');
  });

  it('filters by status', async () => {
    const recorder = recordRequests();
    await endpoint().list({ status: 'needs_response', limit: 20 });

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.url).toContain('status=needs_response');
    expect(request?.url).toContain('limit=20');
  });

  it('listNeedingResponse pins the status the badge counts', async () => {
    const recorder = recordRequests();
    await endpoint().listNeedingResponse({ limit: 5 });

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.url).toContain('status=needs_response');
    expect(request?.url).toContain('limit=5');
  });
});

describe('GET /v1/disputes/:disputeId', () => {
  it('reads one dispute', async () => {
    const dispute = await endpoint().get('dp_01HW0RTDISPUTE00000001');

    expect(dispute.id).toBe('dp_01HW0RTDISPUTE00000001');
    expect(dispute.reason).toBe('fraudulent');
    expect(dispute.network_reason_code).toBe('10.4');
  });
});

describe('POST /v1/disputes/:disputeId/evidence', () => {
  it('posts to the evidence sub-path and moves the dispute under review', async () => {
    const recorder = recordRequests();
    const dispute = await endpoint().submitEvidence('dp_01HW0RTDISPUTE00000001', {
      evidence: { product_description: 'One case of Northwind tea.' },
      submit: true,
    });

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.method).toBe('POST');
    expect(request?.url).toBe(
      'http://localhost/v1/disputes/dp_01HW0RTDISPUTE00000001/evidence',
    );
    expect(dispute.status).toBe('under_review');
    expect(dispute.submitted_at).not.toBeNull();
  });

  it('sends an idempotency key — a resubmitted evidence packet is one packet', async () => {
    const recorder = recordRequests();
    await endpoint().submitEvidence('dp_1', { evidence: {}, submit: false });

    const request = recorder.requests.at(-1);
    recorder.stop();

    expect(request?.headers.get(HEADER_IDEMPOTENCY_KEY)).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it('surfaces dispute_window_closed as a ValidationApiError with its code intact', async () => {
    server.use(
      errorHandler(
        'post',
        '/disputes/:disputeId/evidence',
        422,
        'dispute_window_closed',
        'The response window has closed.',
      ),
    );

    const thrown = await endpoint()
      .submitEvidence('dp_1', { evidence: {}, submit: true })
      .catch((err: unknown) => err);

    expect(thrown).toBeInstanceOf(ValidationApiError);
    expect((thrown as ValidationApiError).code).toBe('dispute_window_closed');
  });

  it('surfaces a 403 as ForbiddenError for a viewer-role session', async () => {
    server.use(
      errorHandler('post', '/disputes/:disputeId/evidence', 403, 'permission_denied'),
    );

    await expect(
      endpoint().submitEvidence('dp_1', { evidence: {}, submit: true }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
