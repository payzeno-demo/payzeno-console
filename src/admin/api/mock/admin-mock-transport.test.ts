/**
 * `?mock=1` on the admin host. The demo has to behave like the api: same shapes, same failures
 * through the same `ConsoleApiError` subclasses, and state that moves when staff act.
 */
import { ConflictApiError, ForbiddenError, UnauthorizedError, ValidationApiError } from '@api/errors';

import { createAdminEndpoints } from '../endpoints';

import { MOCK_MERCHANT_IDS, makeStaffUser } from './admin-fixtures';
import { createAdminMockDb } from './admin-mock-db';
import { AdminMockTransport } from './admin-mock-transport';

function setup(role: Parameters<typeof makeStaffUser>[0] | null = 'admin') {
  const transport = new AdminMockTransport({
    instant: true,
    db: createAdminMockDb({ signedInAs: role ? makeStaffUser(role) : null }),
  });
  return { transport, endpoints: createAdminEndpoints(transport, { apiBaseUrl: 'http://admin.localhost/v1' }) };
}

describe('AdminMockTransport', () => {
  it('starts the demo signed in as an admin', async () => {
    const endpoints = createAdminEndpoints(new AdminMockTransport({ instant: true }), {
      apiBaseUrl: 'http://admin.localhost/v1',
    });
    await expect(endpoints.staffAuth.me()).resolves.toMatchObject({ staff: { role: 'admin' } });
  });

  it('answers 401 without a session, as an UnauthorizedError', async () => {
    const { endpoints } = setup(null);
    await expect(endpoints.staffAuth.me()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('enforces staff roles like the api', async () => {
    const { endpoints } = setup('support');
    await expect(endpoints.reviews.list()).rejects.toBeInstanceOf(ForbiddenError);
    await expect(endpoints.support.listTasks()).resolves.toMatchObject({ has_more: false });
  });

  it('moves an approved merchant out of the KYC queue', async () => {
    const { endpoints } = setup('risk');
    const before = await endpoints.merchants.list({ onboarding_state: 'submitted' });
    expect(before.data).toHaveLength(1);

    await endpoints.merchants.decide(MOCK_MERCHANT_IDS.lumen, 'approve', {});

    const after = await endpoints.merchants.list({ onboarding_state: 'submitted' });
    expect(after.data).toHaveLength(0);
    const detail = await endpoints.merchants.get(MOCK_MERCHANT_IDS.lumen);
    expect(detail.merchant.status).toBe('active');
  });

  it('refuses a rejection with no message as a validation error on `message`', async () => {
    const { endpoints } = setup('risk');
    const error = await endpoints.merchants
      .decide(MOCK_MERCHANT_IDS.lumen, 'reject', {})
      .catch((thrown: unknown) => thrown);
    expect(error).toBeInstanceOf(ValidationApiError);
    expect((error as ValidationApiError).fieldErrors[0]?.path).toBe('message');
  });

  it('answers a second retry of the same item with 409 settlement_locked', async () => {
    const { endpoints } = setup('finance');
    const first = await endpoints.settlements.retryItem('sb_01HZADMBATCH000000001', 'ri_01HZADMITEM00000000001', MOCK_MERCHANT_IDS.northwind, {});
    expect(first.status).toBe('settling');

    const second = await endpoints.settlements
      .retryItem('sb_01HZADMBATCH000000001', 'ri_01HZADMITEM00000000001', MOCK_MERCHANT_IDS.northwind, {})
      .catch((thrown: unknown) => thrown);
    expect(second).toBeInstanceOf(ConflictApiError);
    expect((second as ConflictApiError).isSettlementLocked()).toBe(true);
  });

  it('refuses a staff retry that does not name the merchant it acts for', async () => {
    const { endpoints } = setup('finance');
    await expect(
      endpoints.settlements.retryItem('sb_01HZADMBATCH000000001', 'ri_01HZADMITEM00000000001', '', {}),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('queues an email the support lookup can find', async () => {
    const { endpoints } = setup('admin');
    await endpoints.merchants.decide(MOCK_MERCHANT_IDS.lumen, 'request-info', { message: 'Clearer scan please' });
    const emails = await endpoints.support.emails({ to: 'PRIYA@lumenprint.example' });
    expect(emails.data[0]).toMatchObject({ template: 'onboarding_info_requested' });
  });
});
