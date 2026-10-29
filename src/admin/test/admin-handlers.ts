/**
 * MSW handlers for the admin routes — one per route in RFC platform-v2 §1, plus the two
 * existing staff routes the admin app calls (`POST /v1/disputes/:id/accept`,
 * `POST /v1/settlements/:batchId/items/:itemId/retry`).
 *
 * They are not in `src/test/msw/handlers.ts` (which is the merchant console's list, and is read
 * by `routes.contract.test.ts`); an admin test installs them per case with `server.use(...)`,
 * which `renderAdmin()` does for you. Behaviour comes from `routeAdminRequest()`, the same
 * in-memory api the `?mock=1` admin demo runs on, so a test drives real `ApiClient` → fetch →
 * MSW and gets the api's status codes, error envelope and role checks back.
 */
import { HttpResponse, http } from 'msw';

import { API_BASE } from '@/test/msw/handlers';

import { routeAdminRequest } from '../api/mock/admin-mock-db';
import type { AdminMockDb, MockMethod } from '../api/mock/admin-mock-db';

export interface AdminRoute {
  method: 'get' | 'post';
  path: string;
}

export const ADMIN_HANDLED_ROUTES: ReadonlyArray<AdminRoute> = [
  { method: 'get', path: '/staff/auth/me' },
  { method: 'post', path: '/staff/auth/login' },
  { method: 'post', path: '/staff/auth/logout' },
  { method: 'get', path: '/admin/merchants' },
  { method: 'get', path: '/admin/merchants/:merchantId' },
  { method: 'post', path: '/admin/merchants/:merchantId/onboarding/:decision' },
  { method: 'post', path: '/admin/merchants/:merchantId/status' },
  { method: 'get', path: '/admin/reviews' },
  { method: 'post', path: '/admin/reviews/:reviewId/:decision' },
  { method: 'get', path: '/admin/disputes' },
  { method: 'post', path: '/disputes/:disputeId/accept' },
  { method: 'get', path: '/admin/settlements/backlog' },
  { method: 'post', path: '/settlements/:batchId/items/:itemId/retry' },
  { method: 'get', path: '/admin/support-tasks' },
  { method: 'post', path: '/admin/support-tasks/:taskId/resolve' },
  { method: 'get', path: '/admin/emails' },
];

const VERSION_PREFIX = new URL(API_BASE).pathname;

export function adminHandlers(db: AdminMockDb) {
  return ADMIN_HANDLED_ROUTES.map(({ method, path }) =>
    http[method](`${API_BASE}${path}`, async ({ request }) => {
      const url = new URL(request.url);
      const query = Object.fromEntries(url.searchParams.entries());
      let body: unknown;
      if (method === 'post') {
        const text = await request.text();
        body = text.length > 0 ? (JSON.parse(text) as unknown) : undefined;
      }

      const response = routeAdminRequest(db, {
        method: method.toUpperCase() as MockMethod,
        path: url.pathname.slice(VERSION_PREFIX.length),
        query,
        body,
      });

      if (response.status === 204) return new HttpResponse(null, { status: 204 });
      return HttpResponse.json(response.body as Record<string, unknown>, {
        status: response.status,
        headers: { 'X-Request-Id': 'req_msw_admin_0001' },
      });
    }),
  );
}
