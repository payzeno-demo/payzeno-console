import type {
  Paginated,
  Review,
  ReviewDecisionRequest,
  ReviewListQuery,
} from '@payzeno/contracts';

import { toConsoleApiError } from '@api/http/error-mapper';
import { newIdempotencyKey } from '@api/http/idempotency';
import { pathSegment } from '@api/http/request-builder';
import type { HttpTransport } from '@api/transport';

import { adminQueryParams } from './params';

export type ReviewDecision = 'approve' | 'decline';

/** Page size used when resolving one review out of the list. The api's maximum. */
export const REVIEW_LOOKUP_PAGE_SIZE = 100;
/** How far `find()` walks before giving up — 1,000 reviews is far beyond a real queue. */
export const REVIEW_LOOKUP_MAX_PAGES = 10;

/**
 * `GET /v1/admin/reviews`, `POST /v1/admin/reviews/:id/{approve|decline}`
 * (RFC platform-v2 §1, §8).
 *
 * Approve captures the held authorisation (the shopper gets a `receipt`); decline voids it and
 * cancels the PaymentIntent as `fraudulent` (the shopper gets `payment_declined_after_review`
 * and was never charged).
 */
export class AdminReviewsEndpoint {
  private readonly basePath = '/admin/reviews';

  constructor(private readonly client: HttpTransport) {}

  list(q?: ReviewListQuery): Promise<Paginated<Review>> {
    return this.client.get<Paginated<Review>>(this.basePath, adminQueryParams(q));
  }

  /**
   * One review by id.
   *
   * The RFC defines no `GET /v1/admin/reviews/:id`, so a review detail page resolves its row
   * from the list, walking cursors until it finds it. If the api grows the single-resource
   * route, this method becomes one `get()` and nothing above it changes.
   *
   * @throws {NotFoundApiError} when no page holds the id.
   */
  async find(reviewId: string): Promise<Review> {
    let cursor: string | undefined;

    for (let page = 0; page < REVIEW_LOOKUP_MAX_PAGES; page += 1) {
      const result = await this.list({
        limit: REVIEW_LOOKUP_PAGE_SIZE,
        ...(cursor ? { cursor } : {}),
      });
      const found = result.data.find((review) => review.id === reviewId);
      if (found) return found;
      if (!result.has_more || !result.next_cursor) break;
      cursor = result.next_cursor;
    }

    throw toConsoleApiError({
      ok: false,
      status: 404,
      requestId: 'client',
      body: {
        error: {
          code: 'not_found',
          message: `No review ${reviewId} in the review list.`,
          request_id: 'client',
        },
      },
      raw: undefined,
    });
  }

  decide(
    reviewId: string,
    decision: ReviewDecision,
    req: ReviewDecisionRequest,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<Review> {
    return this.client.post<Review, ReviewDecisionRequest>(
      `${this.basePath}/${pathSegment(reviewId)}/${decision}`,
      req,
      idempotencyKey,
    );
  }
}
