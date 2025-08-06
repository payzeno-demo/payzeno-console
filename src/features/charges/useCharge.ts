/**
 * `useCharge(id)` — `GET /v1/charges/:chargeId`.
 *
 * `charge.card` is the one name for the card fields — the DB flattens it to `card_brand`,
 * `card_last_four` and friends, but the API and every consumer use the nested object. There
 * is no `payment_method_brand` and there never was.
 */
import { useQuery } from '@tanstack/react-query';

import type { CardSummary, Charge } from '@payzeno/contracts';

import { NotFoundApiError } from '@api/errors';
import { useEndpoints } from '@app/ApiContext';
