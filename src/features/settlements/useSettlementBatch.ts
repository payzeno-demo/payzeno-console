/**
 * `useSettlement(batchId)` — `GET /v1/settlements/:batchId`.
 *
 * Renamed from `useSettlementBatch.ts` in the PAY-2043 PR (the-incident.md §8).
 *
 * A 404 here is meaningful: payzeno-api 404s a batch the merchant has no item in, rather
 * than 403ing, because confirming existence across tenants is itself a leak. The detail page
 * therefore renders `<NotFound/>` and not a permission error.
 */
import { useQuery } from '@tanstack/react-query';

