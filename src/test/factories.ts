/**
 * Test factories (tests.md §2.3).
 *
 * Every factory returns a `@payzeno/contracts` type verbatim — not a partial, not a loose
 * object literal. That is deliberate: a factory typed as `Partial<Charge>` compiles against a
 * renamed field and the whole point of the shared package evaporates. When `osquash` bumps
 * `@payzeno/contracts` and a field moves, these are the files that break first, and that is
 * the early warning we want.
 *
 * Values are deterministic. Nothing here reads `Date.now()` or `Math.random()`, because a
 * settlement rollup assertion that changes at midnight is worse than no assertion.
 */
import type {
  ApiKey,
  BankAccount,
  Balance,
  Charge,
  DashboardSummary,
  Dispute,
  Invoice,
  Merchant,
  MerchantSettlementBatch,
  Paginated,
  PaymentIntent,
  Payout,
  ReconciliationItem,
  Refund,
  SessionResponse,
  User,
  WebhookEndpoint,
  WebhookEvent,
} from '@payzeno/contracts';

import { toConsoleSession } from '@/types/session';
import type { ConsoleSession } from '@/types/session';
import type { ConsoleNotification } from '@features/notifications/notification.types';

/** Fixed instant every timestamp below is derived from: 2026-03-14T09:21:07.412Z. */
export const NOW = '2026-03-14T09:21:07.412Z';
/** `GET /v1/auth/me`. `permissions` is populated, so `toConsoleSession` uses it verbatim. */
export function makeSession(overrides: Partial<SessionResponse> = {}): SessionResponse {
  return {
    object: 'session',
    user: makeUser(),
    merchant: makeMerchant(),
    permissions: [
      'payments:read',
      'payments:write',
      'refunds:write',
      'disputes:read',
      'disputes:write',
      'balance:read',
      'payouts:read',
      'payouts:write',
      'settlements:read',
      'settlements:retry',
      'invoices:read',
      'developers:read',
      'developers:write',
      'reporting:read',
      'settings:read',
      'settings:write',
      'team:invite',
    ],
    ...overrides,
  };
}

