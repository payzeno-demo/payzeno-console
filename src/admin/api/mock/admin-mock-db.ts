/**
 * An in-memory payzeno-api for the admin routes.
 *
 * `routeAdminRequest()` answers `(method, path, query, body)` the way payzeno-api does —
 * status code and JSON body, with the api's error envelope on failure, staff role checks
 * included — over a mutable `AdminMockDb`. Two callers:
 *
 *   - `AdminMockTransport` (`?mock=1` on the admin host), which turns a >= 400 into a
 *     `ConsoleApiError` through `error-mapper.ts`, exactly as `ApiClient` would;
 *   - the admin MSW handlers (`src/admin/test/admin-handlers.ts`), which turn it into an HTTP
 *     response, so a test drives the real `ApiClient` → fetch path against the same behaviour.
 *
 * It is stateful on purpose: approving a merchant must move it out of the KYC queue, or the
 * demo and the tests would both be asserting a screen that never changes.
 */
import type {
  AdminMerchantDetail,
  AdminMerchantStatusRequest,
  ApiError,
  Dispute,
  EmailMessage,
  EmailTemplate,
  ErrorCode,
  FieldError,
  MerchantStatus,
  OnboardingDecisionRequest,
  Paginated,
  Review,
  ReviewDecisionRequest,
  StaffLoginRequest,
  ResolveSupportTaskRequest,
  StaffRole,
  StaffUser,
  SupportTask,
} from '@payzeno/contracts';

import type { AdminSettlementBacklog } from '../../types/settlement-backlog';

import {
  makeStaffUser,
  mockBacklog,
  mockDisputes,
  mockEmails,
  mockMerchantDetails,
  mockReviews,
  mockSupportTasks,
  summaryOf,
} from './admin-fixtures';

export interface AdminMockDb {
  /** Who is signed in. `null` = no `pz_staff_session`. */
  session: StaffUser | null;
  staffUsers: StaffUser[];
  merchants: AdminMerchantDetail[];
  reviews: Review[];
  disputes: Dispute[];
  backlog: AdminSettlementBacklog;
  supportTasks: SupportTask[];
  emails: EmailMessage[];
  /** Clock for anything the mock stamps. Tests pin it. */
  now: () => string;
}

export interface CreateAdminMockDbOptions {
  /** Start signed in as this staff user. Default: signed out. */
  signedInAs?: StaffUser | null;
  now?: () => string;
}

export function createAdminMockDb(options: CreateAdminMockDbOptions = {}): AdminMockDb {
  return {
    session: options.signedInAs ?? null,
    staffUsers: (['admin', 'risk', 'finance', 'support'] as const).map((role) => makeStaffUser(role)),
    merchants: mockMerchantDetails(),
    reviews: mockReviews(),
    disputes: mockDisputes(),
    backlog: mockBacklog(),
    supportTasks: mockSupportTasks(),
    emails: mockEmails(),
    now: options.now ?? (() => new Date().toISOString()),
  };
}

export type MockMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface MockRequest {
  method: MockMethod;
  /** Version-free, leading slash: `/admin/merchants/mer_1`. */
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

export interface MockResponse {
  status: number;
  /** `undefined` for 204. */
  body: unknown;
}

// ---------------------------------------------------------------------------------------------
// response helpers
// ---------------------------------------------------------------------------------------------

function ok(body: unknown, status = 200): MockResponse {
  return { status, body };
}

function fail(
  status: number,
  code: ErrorCode,
  message: string,
  fieldErrors?: FieldError[],
  details?: Record<string, string | number | boolean | null>,
): MockResponse {
  const body: ApiError = {
    error: {
      code,
      message,
      request_id: 'req_admin_mock',
      ...(fieldErrors ? { field_errors: fieldErrors } : {}),
      ...(details ? { details } : {}),
    },
  };
  return { status, body };
}

function notFound(path: string): MockResponse {
  return fail(404, 'not_found', `No such resource: ${path}`);
}

function page<T>(rows: ReadonlyArray<T>, query: MockRequest['query']): Paginated<T> {
  const limit = Number(query?.limit ?? 25);
  const offset = Number(query?.cursor ?? 0);
  const slice = rows.slice(offset, offset + limit);
  const nextOffset = offset + slice.length;
  const hasMore = nextOffset < rows.length;
  return { data: slice, next_cursor: hasMore ? String(nextOffset) : null, has_more: hasMore };
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function bodyOf<T extends object>(body: unknown): Partial<T> {
  return typeof body === 'object' && body !== null ? (body as Partial<T>) : {};
}

/** 401 without a session, 403 without the role. `admin` passes every check (RFC §1). */
function guard(db: AdminMockDb, roles: ReadonlyArray<StaffRole> | 'any'): MockResponse | null {
  if (!db.session) return fail(401, 'authentication_required', 'Sign in with your staff account.');
  if (roles === 'any' || db.session.role === 'admin' || roles.includes(db.session.role)) return null;
  // Same envelope as payzeno-api's StaffGuard: `details.required_roles` names the role.
  return fail(403, 'permission_denied', 'Staff role required', undefined, {
    required_roles: roles.join(','),
  });
}

function queueEmail(
  db: AdminMockDb,
  template: EmailTemplate,
  to: string | null | undefined,
  subject: string,
  merchantId: string | null,
): void {
  if (!to) return;
  const at = db.now();
  db.emails.unshift({
    id: `em_mock_${db.emails.length + 1}_${Date.parse(at) || 0}`,
    object: 'email_message',
    template,
    to,
    subject,
    status: 'sent',
    merchant_id: merchantId,
    created_at: at,
    sent_at: at,
  });
}

// ---------------------------------------------------------------------------------------------
// the router
// ---------------------------------------------------------------------------------------------

export function routeAdminRequest(db: AdminMockDb, request: MockRequest): MockResponse {
  const segments = request.path.split('/').filter(Boolean).map(decodeURIComponent);
  const [root, first, second, third, fourth] = segments;

  if (root === 'staff' && first === 'auth') return staffAuth(db, request, second);

  if (root === 'admin') {
    switch (first) {
      case 'merchants':
        return merchants(db, request, second, third, fourth);
      case 'reviews':
        return reviews(db, request, second, third);
      case 'disputes':
        return listDisputes(db, request);
      case 'settlements':
        if (request.method === 'GET' && second === 'backlog') {
          return guard(db, ['finance']) ?? ok(db.backlog);
        }
        return notFound(request.path);
      case 'support-tasks':
        return supportTasks(db, request, second, third);
      case 'emails':
        return emails(db, request);
      default:
        return notFound(request.path);
    }
  }

  // The two existing staff routes outside /admin. Both are merchant-scoped: a staff session
  // names the merchant it acts for with `?merchant_id=`, or the api answers 403.
  if (root === 'disputes' && first && second === 'accept' && request.method === 'POST') {
    return acceptDispute(db, first, str(request.query?.merchant_id));
  }
  if (
    root === 'settlements' &&
    first &&
    second === 'items' &&
    third &&
    fourth === 'retry' &&
    request.method === 'POST'
  ) {
    return retryItem(db, first, third, str(request.query?.merchant_id));
  }

  return notFound(request.path);
}

function staffAuth(db: AdminMockDb, request: MockRequest, action: string | undefined): MockResponse {
  if (request.method === 'GET' && action === 'me') {
    return db.session
      ? ok({ object: 'staff_session', staff: db.session })
      : fail(401, 'authentication_required', 'Not signed in.');
  }
  if (request.method === 'POST' && action === 'login') {
    const { email, password } = bodyOf<StaffLoginRequest>(request.body);
    const staff = db.staffUsers.find(
      (candidate) => candidate.email.toLowerCase() === (email ?? '').trim().toLowerCase(),
    );
    // The demo accepts any non-empty password for a known staff address.
    if (!staff || !str(password)) {
      return fail(401, 'authentication_required', 'Invalid email or password.');
    }
    db.session = staff;
    return ok({ object: 'staff_session', staff });
  }
  if (request.method === 'POST' && action === 'logout') {
    db.session = null;
    return ok(undefined, 204);
  }
  return notFound(request.path);
}

function merchants(
  db: AdminMockDb,
  request: MockRequest,
  merchantId: string | undefined,
  sub: string | undefined,
  action: string | undefined,
): MockResponse {
  if (!merchantId) {
    const denied = guard(db, 'any');
    if (denied) return denied;
    const status = str(request.query?.status);
    const onboardingState = str(request.query?.onboarding_state);
    const needle = str(request.query?.q)?.toLowerCase();
    const rows = db.merchants
      .map(summaryOf)
      .filter((row) => !status || row.merchant.status === status)
      .filter((row) => !onboardingState || row.onboarding_state === onboardingState)
      .filter(
        (row) =>
          !needle ||
          [row.merchant.id, row.merchant.legal_name, row.merchant.display_name, row.owner_email ?? '']
            .join(' ')
            .toLowerCase()
            .includes(needle),
      );
    return ok(page(rows, request.query));
  }

  const detail = db.merchants.find((candidate) => candidate.merchant.id === merchantId);
  if (!detail) return notFound(request.path);

  if (request.method === 'GET' && !sub) return guard(db, 'any') ?? ok(detail);

  if (request.method === 'POST' && sub === 'onboarding') {
    const denied = guard(db, ['risk']);
    if (denied) return denied;
    return decideOnboarding(db, detail, action, bodyOf<OnboardingDecisionRequest>(request.body));
  }

  if (request.method === 'POST' && sub === 'status') {
    const denied = guard(db, ['risk']);
    if (denied) return denied;
    const { status, reason } = bodyOf<AdminMerchantStatusRequest>(request.body);
    if (!str(reason)) {
      return fail(422, 'validation_failed', 'A reason is required.', [
        { path: 'reason', code: 'required', message: 'Say why — it goes in the audit log.' },
      ]);
    }
    const allowed: ReadonlyArray<MerchantStatus> = ['active', 'restricted', 'suspended'];
    if (!status || !allowed.includes(status)) {
      return fail(422, 'validation_failed', 'Unsupported status.', [
        { path: 'status', code: 'invalid', message: 'Must be active, restricted or suspended.' },
      ]);
    }
    if (status === 'active' && detail.onboarding.state !== 'approved') {
      return fail(409, 'invalid_state', 'Only an approved merchant can be reactivated.');
    }
    detail.merchant = { ...detail.merchant, status, updated_at: db.now() };
    return ok(detail);
  }

  return notFound(request.path);
}

function decideOnboarding(
  db: AdminMockDb,
  detail: AdminMerchantDetail,
  action: string | undefined,
  req: Partial<OnboardingDecisionRequest>,
): MockResponse {
  const owner = detail.users.find((user) => user.role === 'owner');
  const state = detail.onboarding.state;
  const message = str(req.message?.trim());
  const at = db.now();

  if (action === 'approve') {
    if (state !== 'submitted') {
      return fail(409, 'invalid_state', `Onboarding is ${state}; only a submitted application can be approved.`);
    }
    detail.onboarding = { ...detail.onboarding, state: 'approved', decided_at: at, staff_message: null };
    detail.merchant = { ...detail.merchant, status: 'active', updated_at: at };
    queueEmail(db, 'onboarding_approved', owner?.email, 'Your Payzeno account is approved', detail.merchant.id);
    return ok(detail);
  }

  if (action === 'reject' || action === 'request-info') {
    if (!message) {
      return fail(422, 'validation_failed', 'A message to the merchant is required.', [
        { path: 'message', code: 'required', message: 'Tell the merchant what happens next.' },
      ]);
    }
    const legal = action === 'reject' ? ['submitted', 'needs_info'] : ['submitted'];
    if (!legal.includes(state)) {
      return fail(409, 'invalid_state', `Onboarding is ${state}.`);
    }
    if (action === 'reject') {
      detail.onboarding = { ...detail.onboarding, state: 'rejected', decided_at: at, staff_message: message };
      detail.merchant = { ...detail.merchant, status: 'rejected', updated_at: at };
      queueEmail(db, 'onboarding_rejected', owner?.email, 'About your Payzeno application', detail.merchant.id);
    } else {
      detail.onboarding = { ...detail.onboarding, state: 'needs_info', decided_at: at, staff_message: message };
      queueEmail(db, 'onboarding_info_requested', owner?.email, 'We need a little more information', detail.merchant.id);
    }
    return ok(detail);
  }

  return notFound(`/admin/merchants/${detail.merchant.id}/onboarding/${action ?? ''}`);
}

function reviews(
  db: AdminMockDb,
  request: MockRequest,
  reviewId: string | undefined,
  action: string | undefined,
): MockResponse {
  const denied = guard(db, ['risk']);
  if (denied) return denied;

  if (request.method === 'GET' && !reviewId) {
    const status = str(request.query?.status);
    const merchantId = str(request.query?.merchant_id);
    const rows = db.reviews
      .filter((review) => !status || review.status === status)
      .filter((review) => !merchantId || review.merchant_id === merchantId)
      // Oldest open first: the queue is worked in arrival order.
      .sort((a, b) => a.opened_at.localeCompare(b.opened_at));
    return ok(page(rows, request.query));
  }

  if (request.method === 'POST' && reviewId && (action === 'approve' || action === 'decline')) {
    const index = db.reviews.findIndex((review) => review.id === reviewId);
    const review = db.reviews[index];
    if (!review) return notFound(request.path);
    if (review.status !== 'open') {
      return fail(409, 'invalid_state', `Review is already ${review.status}.`);
    }
    const { note } = bodyOf<ReviewDecisionRequest>(request.body);
    const updated: Review = {
      ...review,
      status: action === 'approve' ? 'approved' : 'declined',
      closed_at: db.now(),
      closed_by: db.session?.id ?? null,
      note: str(note?.trim()) ?? null,
    };
    db.reviews[index] = updated;
    return ok(updated);
  }

  return notFound(request.path);
}

function listDisputes(db: AdminMockDb, request: MockRequest): MockResponse {
  const denied = guard(db, ['risk']);
  if (denied) return denied;
  if (request.method !== 'GET') return notFound(request.path);
  const status = str(request.query?.status);
  const merchantId = str(request.query?.merchant_id);
  const rows = db.disputes
    .filter((dispute) => !status || dispute.status === status)
    .filter((dispute) => !merchantId || dispute.merchant_id === merchantId);
  return ok(page(rows, request.query));
}

/** Merchant-scoped routes need `?merchant_id=` from a staff session (`MerchantScopeGuard`). */
function requireActingMerchant(merchantId: string | undefined): MockResponse | null {
  return merchantId
    ? null
    : fail(403, 'permission_denied', 'Staff must name the merchant they act for (?merchant_id=).');
}

function acceptDispute(db: AdminMockDb, disputeId: string, merchantId: string | undefined): MockResponse {
  const denied = guard(db, ['risk']) ?? requireActingMerchant(merchantId);
  if (denied) return denied;
  // Scoped like the api: another merchant's dispute is a 404.
  const index = db.disputes.findIndex(
    (dispute) => dispute.id === disputeId && dispute.merchant_id === merchantId,
  );
  const dispute = db.disputes[index];
  if (!dispute) return notFound(`/disputes/${disputeId}/accept`);
  if (dispute.status !== 'needs_response') {
    return fail(409, 'invalid_state', `A dispute in ${dispute.status} cannot be accepted.`);
  }
  const updated: Dispute = { ...dispute, status: 'lost', resolved_at: db.now() };
  db.disputes[index] = updated;
  return ok(updated);
}

function retryItem(
  db: AdminMockDb,
  batchId: string,
  itemId: string,
  merchantId: string | undefined,
): MockResponse {
  const denied = guard(db, ['finance']) ?? requireActingMerchant(merchantId);
  if (denied) return denied;
  const items = db.backlog.items ?? [];
  const index = items.findIndex(
    (item) => item.id === itemId && item.batch_id === batchId && item.merchant_id === merchantId,
  );
  const item = items[index];
  if (!item) return notFound(`/settlements/${batchId}/items/${itemId}/retry`);
  if (item.status === 'settling') {
    return fail(409, 'settlement_locked', 'A reconciliation sweep holds this batch.');
  }
  const wasRetryable = item.status === 'retryable';
  const updated = { ...item, status: 'settling' as const, attempt_count: item.attempt_count + 1 };
  items[index] = updated;
  db.backlog = {
    ...db.backlog,
    items,
    retryable: wasRetryable ? Math.max(0, db.backlog.retryable - 1) : db.backlog.retryable,
  };
  return ok(updated, 202);
}

function supportTasks(
  db: AdminMockDb,
  request: MockRequest,
  taskId: string | undefined,
  action: string | undefined,
): MockResponse {
  const denied = guard(db, ['support']);
  if (denied) return denied;

  if (request.method === 'GET' && !taskId) {
    const status = str(request.query?.status);
    const rows = db.supportTasks.filter((task) => !status || task.status === status);
    return ok(page(rows, request.query));
  }

  if (request.method === 'POST' && taskId && action === 'resolve') {
    const index = db.supportTasks.findIndex((task) => task.id === taskId);
    const task = db.supportTasks[index];
    if (!task) return notFound(request.path);
    if (task.status === 'resolved' || task.status === 'dismissed') {
      return fail(409, 'invalid_state', `Task is already ${task.status}.`);
    }
    const { note } = bodyOf<ResolveSupportTaskRequest>(request.body);
    const updated: SupportTask = {
      ...task,
      status: 'resolved',
      assigned_to: db.session?.id ?? null,
      resolved_at: db.now(),
      resolution_note: str(note?.trim()) ?? null,
    };
    db.supportTasks[index] = updated;
    return ok(updated);
  }

  return notFound(request.path);
}

function emails(db: AdminMockDb, request: MockRequest): MockResponse {
  const denied = guard(db, ['support']);
  if (denied) return denied;
  const to = str(request.query?.to)?.trim().toLowerCase();
  if (!to) {
    return fail(422, 'validation_failed', 'An address is required.', [
      { path: 'to', code: 'required', message: 'Enter the address to look up.' },
    ]);
  }
  const rows = db.emails
    .filter((email) => email.to.toLowerCase() === to)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return ok(page(rows, request.query));
}
