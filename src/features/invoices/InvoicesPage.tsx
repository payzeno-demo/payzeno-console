/**
 * `InvoicesPage` — the invoices index route. `InvoiceDetailPage` is its child.
 *
 * The coldest page in the console, and the only one still on the legacy fetch path. It has one
 * test. Both facts are on purpose (blueprint §8.5) and both are tracked: PAY-1902.
 */
import { INVOICE_STATUSES } from '@payzeno/contracts';
import type { InvoiceStatus } from '@payzeno/contracts';
