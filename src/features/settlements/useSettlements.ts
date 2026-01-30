/**
 * `useSettlements(q)` — `GET /v1/settlements` (api-surface.md §12).
 *
 * The rows are `MerchantSettlementBatch`, never `SettlementBatch`: acquirer-level totals
 * belong to every merchant in the file at once and are not returned on a session-authed
 * route.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { MerchantSettlementBatch } from '@payzeno/contracts';

import type { SettlementListQuery } from '@api/endpoints/settlements.endpoint';
import { useEndpoints } from '@app/ApiContext';
import type { SettlementRow } from '@types/view-models';

import { settlementsListQuery } from './settlements.queries';

