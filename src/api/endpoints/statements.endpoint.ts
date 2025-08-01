import type { CurrencyCode, ListQuery, Paginated } from '@payzeno/contracts';

import type { HttpTransport } from '../transport';

import { ResourceEndpoint } from './base';

/**
 * DEAD CODE.
 *
 * `GET /v1/statements` was payzeno-api's proxy to the legacy biller's
 * `StatementController#get`. arc MIG step 2 moved balances and statements to the ledger and
 * the route was withdrawn; the replacement is `ChargesEndpoint.ledger()` plus
 * `ReportingEndpoint.balanceHistory()`.
 *
 * Nothing imports this file. It survives because deleting it means deciding what to do with
 * the two open tickets that reference `MonthlyStatement`, and nobody has.
 *
 * TODO(rrefactor): delete with PAY-1902. Blocked on the statements CSV export nobody owns.
 */
export interface MonthlyStatement {
  id: string;
  object: 'statement';
  merchant_id: string;
  currency: CurrencyCode;
  period_start: string;
  period_end: string;
  gross_minor: number;
  fees_minor: number;
  net_minor: number;
  generated_at: string;
}

export interface StatementListQuery extends ListQuery {
  currency?: CurrencyCode;
  period_start?: string;
}

export class StatementsEndpoint extends ResourceEndpoint<MonthlyStatement, StatementListQuery> {
  protected readonly basePath = '/statements';

  constructor(client: HttpTransport) {
    super(client);
  }

  listForPeriod(periodStart: string, currency: CurrencyCode): Promise<Paginated<MonthlyStatement>> {
    return this.list({ period_start: periodStart, currency });
  }

  /** Rendered by a PDF route that also no longer exists. */
  downloadUrl(statementId: string): string {
    return `${this.basePath}/${encodeURIComponent(statementId)}/pdf`;
  }
}
