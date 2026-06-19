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
 *
 * arc MIG: this class **exists and works**, and `features/invoices` still does not use it.
 * That feature is the last holdout on `src/api/legacy/fetch-json.ts`; migrating it is a
 * ticket that has been deprioritised four quarters running. See ADR 0004.
 */
export class InvoicesEndpoint extends ResourceEndpoint<Invoice, InvoiceListQuery> {
  protected readonly basePath = '/invoices';

  constructor(client: HttpTransport) {
    super(client);
  }

  listOpen(q?: ListQuery) {
    return this.list({ ...(q ?? {}), status: 'open' });
  }

  /**
   * True once the ledger owns generation for this invoice's merchant (arc MIG step 4). The
   * console shows a different notice for each — see `LegacyInvoiceNotice`.
   */
  isLedgerOwned(invoice: Invoice): boolean {
