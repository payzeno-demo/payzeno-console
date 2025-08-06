import { queryOptions } from '@tanstack/react-query';

import type {
  Charge,
  ChargeLedgerResponse,
  ChargeListQuery,
  Paginated,
} from '@payzeno/contracts';

import type { EndpointRegistry } from '@api/endpoints';
import { queryKeys } from '@api/queryKeys';
import { DEFAULT_PAGE_SIZE } from '@config/constants';

/**
 * arc PERF (PAY-1904): the charge list used to default to a status filter plus a
 * created-descending sort that payzeno-api could not serve from an index — it seq-scanned
 * `charge` for every merchant on every page load. Migration 14 added
