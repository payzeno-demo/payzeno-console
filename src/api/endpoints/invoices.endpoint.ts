import type { Invoice, InvoiceStatus, ListQuery } from '@payzeno/contracts';

import type { HttpTransport } from '../transport';

import { ResourceEndpoint } from './base';

export interface InvoiceListQuery extends ListQuery {
  status?: InvoiceStatus;
}

/**
 * `GET /v1/invoices`, `GET /v1/invoices/:invoiceId` (api-surface.md §9). payzeno-api reads
 * through to payzeno-billing-legacy's `GET /internal/v1/invoices`, wrapped in a circuit
 * breaker — a trip surfaces here as `502 legacy_upstream_unavailable`.
