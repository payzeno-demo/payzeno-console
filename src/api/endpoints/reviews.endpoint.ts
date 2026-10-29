import type { Review, ReviewListQuery } from '@payzeno/contracts';

import type { HttpTransport } from '../transport';

import { ResourceEndpoint } from './base';

/**
 * `GET /v1/reviews`, `GET /v1/reviews/:reviewId` (RFC platform-v2 §8).
 *
 * Read-only on purpose. A review is a Payzeno risk decision about a held authorisation; the
 * approve / decline routes live under `/v1/admin/reviews` and only staff can reach them. There
 * is no mutation on this class and there must never be one.
 */
export class ReviewsEndpoint extends ResourceEndpoint<Review, ReviewListQuery> {
  protected readonly basePath = '/reviews';

  constructor(client: HttpTransport) {
    super(client);
  }
}
