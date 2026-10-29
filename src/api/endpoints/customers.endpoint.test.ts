/**
 * `CustomersEndpoint` — RFC platform-v2 §5. Paths are strict; a saved card is an id and a
 * `CardSummary`, never a token.
 */
import { describe, expect, it } from 'vitest';

import { ApiClient } from '@api/client';
import { ResourceEndpoint } from '@api/endpoints/base';
import { CustomersEndpoint } from '@api/endpoints/customers.endpoint';
import { HEADER_IDEMPOTENCY_KEY } from '@api/http/headers';
import { CUSTOMER_ID } from '@/test/factories';
import { recordRequests } from '@/test/msw/server';

function endpoint(): CustomersEndpoint {
  return new CustomersEndpoint(new ApiClient({ retries: 0 }));
}

describe('shape', () => {
  it('extends ResourceEndpoint directly', () => {
    expect(Object.getPrototypeOf(CustomersEndpoint)).toBe(ResourceEndpoint);
  });
});

describe('reads', () => {
  it('sends the email filter as a query parameter', async () => {
    const recorder = recordRequests();
    const page = await endpoint().list({ email: 'liam.becker@example.de' });

    expect(page.data.map((customer) => customer.email)).toEqual(['liam.becker@example.de']);
    expect(recorder.requests[0]?.url).toContain('/v1/customers?email=liam.becker%40example.de');
    recorder.stop();
  });

  it('lists saved cards without any vault token', async () => {
    const page = await endpoint().listPaymentMethods(CUSTOMER_ID);

    for (const method of page.data) {
      expect(method.id).toMatch(/^pm_/);
      expect(JSON.stringify(method)).not.toMatch(/pmt_/);
    }
  });
});

describe('writes', () => {
  it('removes a saved card with an idempotent DELETE on the nested route', async () => {
    const recorder = recordRequests();
    await endpoint().removePaymentMethod(CUSTOMER_ID, 'pm_01HW0RTPAYMENTMETHOD0002');

    const request = recorder.requests[0];
    expect(request?.method).toBe('DELETE');
    expect(request?.url).toMatch(
      new RegExp(`/v1/customers/${CUSTOMER_ID}/payment_methods/pm_01HW0RTPAYMENTMETHOD0002$`),
    );
    expect(request?.headers.get(HEADER_IDEMPOTENCY_KEY)).toBeTruthy();
    recorder.stop();
  });

  it('PATCHes a customer', async () => {
    const recorder = recordRequests();
    const customer = await endpoint().update(CUSTOMER_ID, { name: 'Amara O.' });

    expect(customer.name).toBe('Amara O.');
    expect(recorder.requests[0]?.method).toBe('PATCH');
    recorder.stop();
  });
});
