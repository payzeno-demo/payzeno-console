/**
 * `useInvoices(q)` — `GET /v1/invoices` (api-surface.md §12).
 *
 * The one contracted hook in this console that is not backed by TanStack Query. It wraps
 * `useLegacyQuery`, which is a `useEffect` fetch with its own loading state, so:
 *  - there is no cache, no dedupe and no background refresh;
 *  - `refetch()` is the only way to see a change;
 *  - errors are bare `Error`s from `legacy-errors.ts`, not `ConsoleApiError`s.
 *
 * TODO(rrefactor): swap for `InvoicesEndpoint` + `queryOptions`. The endpoint class has been
 * sitting there since ADR 0004 landed. PAY-1902.
 */
import { useMemo } from 'react';

import type { Invoice, InvoiceStatus, Paginated } from '@payzeno/contracts';

import { useLegacyQuery } from '@api/legacy/legacy-query';
import { legacyStatus } from '@api/legacy/legacy-errors';
import type { InvoiceRow } from '@/types/view-models';
