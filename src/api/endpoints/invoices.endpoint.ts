import type { Invoice, InvoiceStatus, ListQuery } from '@payzeno/contracts';

import type { HttpTransport } from '../transport';

import { ResourceEndpoint } from './base';

export interface InvoiceListQuery extends ListQuery {
  status?: InvoiceStatus;
}

