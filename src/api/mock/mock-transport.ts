/**
 * `MockTransport implements HttpTransport` — the second implementation of the transport
 * seam, selected by `TransportProvider` on `?mock=1`. Sales runs the demo on it, so this is
 * production code and it must answer every route in api-surface.md §12.
 *
 * It routes on `(method, path)` exactly the way payzeno-api does, and it fails the same way:
 * an unknown path is a `NotFoundApiError` from `error-mapper.ts`, not a thrown string.
 */
import type { Paginated } from '@payzeno/contracts';

import { toConsoleApiError } from '../http/error-mapper';
import type { HttpTransport, QueryParams, RequestSpec } from '../transport';

import {
  mockApiKeys,
  mockBalance,
  mockBankAccounts,
  mockCharges,
  mockDashboardSummary,
  mockDisputes,
  mockInvoices,
  mockPaymentIntents,
  mockPayouts,
  mockRefunds,
  mockSession,
  mockSettlementItems,
  mockSettlements,
  mockWebhookEndpoints,
  mockWebhookEvents,
} from './fixtures';
import { withLatency, withMutationLatency } from './latency';

function page<T>(rows: ReadonlyArray<T>): Paginated<T> {
  return { data: [...rows], next_cursor: null, has_more: false };
}

function notFound(path: string): never {
  throw toConsoleApiError({
    ok: false,
    status: 404,
    requestId: 'mock',
    body: {
      error: {
        code: 'not_found',
        message: `MockTransport has no fixture for ${path}`,
        request_id: 'mock',
      },
    },
    raw: undefined,
  });
}

function byId<T extends { id: string }>(rows: ReadonlyArray<T>, id: string, path: string): T {
  const found = rows.find((row) => row.id === id);
  if (!found) notFound(path);
  return found;
}

export class MockTransport implements HttpTransport {
  async request<TRes, TBody = unknown>(spec: RequestSpec<TBody>): Promise<TRes> {
    if (spec.method === 'GET') return this.get<TRes>(spec.path, spec.query);
    if (spec.method === 'DELETE') {
      await this.delete(spec.path, spec.idempotencyKey ?? 'mock');
      return undefined as TRes;
    }
    return this.post<TRes, TBody>(spec.path, spec.body as TBody, spec.idempotencyKey ?? 'mock');
  }

  get<TRes>(path: string, query?: QueryParams): Promise<TRes> {
    return withLatency(path, () => this.resolveGet(path, query) as TRes);
  }

  post<TRes, TBody>(path: string, body: TBody, _idempotencyKey: string): Promise<TRes> {
    return withMutationLatency(path, () => this.resolvePost(path, body) as TRes);
  }

  patch<TRes, TBody>(path: string, body: TBody, _idempotencyKey: string): Promise<TRes> {
    return withMutationLatency(path, () => this.resolvePost(path, body) as TRes);
  }

  async delete(path: string, _idempotencyKey: string): Promise<void> {
    await withMutationLatency(path, () => {
      // Deletions are accepted and discarded; the fixture set is immutable so the demo can
      // be re-run without a reload.
      return undefined;
    });
  }

  private resolveGet(path: string, query?: QueryParams): unknown {
    const segments = path.split('/').filter(Boolean);
    const [root, first, second] = segments;

    switch (root) {
      case 'auth':
        if (first === 'me') return mockSession;
        return notFound(path);
      case 'balance':
        return mockBalance;
      case 'payment_intents':
        return first ? byId(mockPaymentIntents, first, path) : page(mockPaymentIntents);
      case 'charges':
        if (first && second === 'ledger') {
          return { charge_id: first, transactions: [] };
        }
        return first ? byId(mockCharges, first, path) : page(mockCharges);
      case 'refunds':
        return first ? byId(mockRefunds, first, path) : page(mockRefunds);
      case 'disputes':
        return first ? byId(mockDisputes, first, path) : page(mockDisputes);
      case 'payouts':
        return first ? byId(mockPayouts, first, path) : page(mockPayouts);
      case 'settlements':
        if (first && second === 'items') return page(mockSettlementItems);
        return first ? byId(mockSettlements, first, path) : page(mockSettlements);
      case 'invoices':
        return first ? byId(mockInvoices, first, path) : page(mockInvoices);
      case 'api-keys':
        return first ? byId(mockApiKeys, first, path) : page(mockApiKeys);
      case 'bank-accounts':
        return first ? byId(mockBankAccounts, first, path) : page(mockBankAccounts);
      case 'webhook_events':
        return first ? byId(mockWebhookEvents, first, path) : page(mockWebhookEvents);
      case 'webhook_endpoints':
        return page(mockWebhookEndpoints);
      case 'reporting':
        return this.resolveReporting(first, query);
      default:
        return notFound(path);
    }
  }

  private resolveReporting(kind: string | undefined, query?: QueryParams): unknown {
    switch (kind) {
      case 'summary':
        return mockDashboardSummary;
      case 'volume':
        return {
          object: 'volume_timeseries',
          merchant_id: mockDashboardSummary.merchant_id,
          currency: query?.currency ?? 'GBP',
          interval: query?.interval ?? 'day',
          points: mockCharges.map((c, i) => ({
            bucket_start: `2026-01-${String(8 + i).padStart(2, '0')}T00:00:00.000Z`,
            amount_minor: c.amount_minor * 37,
            count: 120 + i * 9,
          })),
        };
      case 'balance-history':
        return {
          merchant_id: mockDashboardSummary.merchant_id,
          currency: query?.currency ?? 'GBP',
          interval: query?.interval ?? 'day',
          points: mockCharges.map((c, i) => ({
            bucket_start: `2026-01-${String(8 + i).padStart(2, '0')}T00:00:00.000Z`,
            amount_minor: mockBalance.available_minor - i * 40_000 + c.amount_minor,
            count: 1,
          })),
        };
      default:
        return notFound(`/reporting/${kind ?? ''}`);
    }
  }

  private resolvePost(path: string, body: unknown): unknown {
    const segments = path.split('/').filter(Boolean);
    const [root, first, second, third, fourth] = segments;

    if (root === 'auth' && first === 'login') {
      return { object: 'login', user: mockSession.user, merchant: mockSession.merchant };
    }
    if (root === 'auth' && first === 'logout') return undefined;

    if (root === 'refunds') {
      const request = body as { charge_id: string; amount_minor?: number };
      const source = byId(mockCharges, request.charge_id, path);
      return {
        ...mockRefunds[0],
        id: `re_mock_${Date.now()}`,
        charge_id: source.id,
        amount_minor: request.amount_minor ?? source.captured_amount_minor,
        currency: source.currency,
      };
    }

    if (root === 'payouts' && first && second === 'cancel') {
      return { ...byId(mockPayouts, first, path), status: 'canceled' };
    }
    if (root === 'payouts') {
      return { ...mockPayouts[0], id: `po_mock_${Date.now()}`, status: 'scheduled' };
    }

    if (root === 'payment_intents' && first && (second === 'capture' || second === 'cancel')) {
      const intent = byId(mockPaymentIntents, first, path);
      return { ...intent, status: second === 'capture' ? 'succeeded' : 'canceled' };
    }

    if (root === 'disputes' && first && second === 'evidence') {
      return { ...byId(mockDisputes, first, path), status: 'under_review', submitted_at: new Date().toISOString() };
    }

    // POST /settlements/:batchId/items/:itemId/retry — the arc-INC route. Half the time the
    // demo shows the 409 no-op path, because that is what really happens.
    if (root === 'settlements' && second === 'items' && fourth === 'retry' && third) {
      const target = byId(mockSettlementItems, third, path);
      if (target.attempt_count % 2 === 0) {
        throw toConsoleApiError({
          ok: false,
          status: 409,
          requestId: 'mock',
          body: {
            error: {
              code: 'settlement_locked',
              message: 'A reconciliation sweep holds this batch.',
              request_id: 'mock',
              details: { item_id: target.id },
            },
          },
          raw: undefined,
        });
      }
      return { ...target, status: 'settling', attempt_count: target.attempt_count + 1 };
    }

    if (root === 'api-keys') {
      return { ...mockApiKeys[0], id: `key_mock_${Date.now()}`, secret: 'sk_live_mock_demo_secret' };
    }
    if (root === 'bank-accounts') {
      return { ...mockBankAccounts[0], id: `ba_mock_${Date.now()}` };
    }
    if (root === 'webhook_events' && first && second === 'redeliver') {
      return { ...byId(mockWebhookEvents, first, path), status: 'pending', attempt_count: 0 };
    }

    return notFound(path);
  }
}
