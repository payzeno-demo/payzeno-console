/**
 * Every admin endpoint method, through the real `ApiClient` against MSW: the verb, the path
 * the RFC names, the query string, and the two headers a staff mutation must carry
 * (`Idempotency-Key`, and `X-Payzeno-CSRF` from the shared `pz_csrf` cookie).
 */
import { API_BASE } from '@/test/msw/handlers';
import { recordRequests, server } from '@/test/msw/server';
import { ApiClient } from '@api/client';

import { adminHandlers } from '../../test/admin-handlers';
import { MOCK_MERCHANT_IDS, makeStaffUser } from '../mock/admin-fixtures';
import { createAdminMockDb } from '../mock/admin-mock-db';

import { createAdminEndpoints } from './index';

function setup() {
  const db = createAdminMockDb({ signedInAs: makeStaffUser('admin'), now: () => '2026-10-29T10:00:00.000Z' });
  server.use(...adminHandlers(db));
  const endpoints = createAdminEndpoints(new ApiClient({ baseUrl: API_BASE, retries: 0 }), {
    apiBaseUrl: API_BASE,
  });
  const recorder = recordRequests();
  return { db, endpoints, recorder };
}

describe('admin endpoints', () => {
  beforeEach(() => {
    document.cookie = 'pz_csrf=csrf-admin-token';
  });
  afterEach(() => {
    document.cookie = 'pz_csrf=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  it('staff auth: me, login and logout', async () => {
    const { endpoints, recorder, db } = setup();

    await expect(endpoints.staffAuth.me()).resolves.toMatchObject({ object: 'staff_session' });
    await endpoints.staffAuth.logout();
    expect(db.session).toBeNull();
    await endpoints.staffAuth.login({ email: 'finance@staff.payzeno.example', password: 'x' });
    expect(db.session?.role).toBe('finance');

    expect(recorder.requests.map((r) => `${r.method} ${new URL(r.url).pathname}`)).toEqual([
      'GET /v1/staff/auth/me',
      'POST /v1/staff/auth/logout',
      'POST /v1/staff/auth/login',
    ]);
    recorder.stop();
  });

  it('merchants: list with filters, detail, decisions, status and document links', async () => {
    const { endpoints, recorder } = setup();

    const page = await endpoints.merchants.list({ onboarding_state: 'submitted', q: 'lumen', limit: 10 });
    expect(page.data.map((row) => row.merchant.id)).toEqual([MOCK_MERCHANT_IDS.lumen]);

    await endpoints.merchants.get(MOCK_MERCHANT_IDS.lumen);
    await endpoints.merchants.decide(MOCK_MERCHANT_IDS.lumen, 'request-info', { message: 'More please' });
    await endpoints.merchants.setStatus(MOCK_MERCHANT_IDS.northwind, { status: 'restricted', reason: 'PAY-1' });

    const [list, detail, decide, status] = recorder.requests;
    expect(list?.url).toBe(`${API_BASE}/admin/merchants?onboarding_state=submitted&q=lumen&limit=10`);
    expect(detail?.url).toBe(`${API_BASE}/admin/merchants/${MOCK_MERCHANT_IDS.lumen}`);
    expect(decide?.method).toBe('POST');
    expect(decide?.url).toBe(`${API_BASE}/admin/merchants/${MOCK_MERCHANT_IDS.lumen}/onboarding/request-info`);
    expect(decide?.headers.get('X-Payzeno-CSRF')).toBe('csrf-admin-token');
    expect(decide?.headers.get('Idempotency-Key')).toBeTruthy();
    expect(status?.url).toBe(`${API_BASE}/admin/merchants/${MOCK_MERCHANT_IDS.northwind}/status`);

    expect(endpoints.merchants.documentContentUrl('mer_1', 'kyc/2')).toBe(
      `${API_BASE}/admin/merchants/mer_1/documents/kyc%2F2/content`,
    );
    recorder.stop();
  });

  it('reviews: list by status, find one through the list, approve and decline', async () => {
    const { endpoints, recorder } = setup();

    const open = await endpoints.reviews.list({ status: 'open' });
    expect(open.data.every((review) => review.status === 'open')).toBe(true);

    const found = await endpoints.reviews.find('rv_01HZADMREVIEW0000000004');
    expect(found.status).toBe('approved');
    await expect(endpoints.reviews.find('rv_missing')).rejects.toMatchObject({ status: 404 });

    await endpoints.reviews.decide('rv_01HZADMREVIEW0000000001', 'approve', { note: 'ok' });
    await endpoints.reviews.decide('rv_01HZADMREVIEW0000000002', 'decline', {});

    const posts = recorder.requests.filter((r) => r.method === 'POST').map((r) => new URL(r.url).pathname);
    expect(posts).toEqual([
      '/v1/admin/reviews/rv_01HZADMREVIEW0000000001/approve',
      '/v1/admin/reviews/rv_01HZADMREVIEW0000000002/decline',
    ]);
    recorder.stop();
  });

  it('disputes, settlements and support hit the routes the RFC names', async () => {
    const { endpoints, recorder } = setup();

    await endpoints.disputes.list({ status: 'needs_response' });
    await endpoints.disputes.accept('dp_01HZADMDISPUTE000000001', MOCK_MERCHANT_IDS.northwind);
    await endpoints.settlements.backlog();
    await endpoints.settlements.retryItem(
      'sb_01HZADMBATCH000000001',
      'ri_01HZADMITEM00000000001',
      MOCK_MERCHANT_IDS.northwind,
      {},
    );
    await endpoints.support.listTasks({ status: 'open' });
    await endpoints.support.resolveTask('sup_01HZADMTASK00000000001', { note: 'done' });
    await endpoints.support.emails({ to: 'priya@lumenprint.example' });

    expect(recorder.requests.map((r) => `${r.method} ${r.url.replace(API_BASE, '')}`)).toEqual([
      'GET /admin/disputes?status=needs_response',
      'POST /disputes/dp_01HZADMDISPUTE000000001/accept?merchant_id=mer_01HZADMNORTHWIND000001',
      'GET /admin/settlements/backlog',
      'POST /settlements/sb_01HZADMBATCH000000001/items/ri_01HZADMITEM00000000001/retry?merchant_id=mer_01HZADMNORTHWIND000001',
      'GET /admin/support-tasks?status=open',
      'POST /admin/support-tasks/sup_01HZADMTASK00000000001/resolve',
      'GET /admin/emails?to=priya%40lumenprint.example',
    ]);
    recorder.stop();
  });
});
