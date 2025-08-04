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
