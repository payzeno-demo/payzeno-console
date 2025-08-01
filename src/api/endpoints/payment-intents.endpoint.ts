import type {
  CancelPaymentIntentRequest,
  CapturePaymentIntentRequest,
  PaymentIntent,
  PaymentIntentListQuery,
  PaymentIntentResponse,
} from '@payzeno/contracts';

import { newIdempotencyKey } from '../http/idempotency';
import type { HttpTransport } from '../transport';

import { ResourceEndpoint } from './base';

/**
 * `GET /v1/payment_intents`, `GET /v1/payment_intents/:id`,
 * `POST /v1/payment_intents/:id/capture`, `POST /v1/payment_intents/:id/cancel`
 * (api-surface.md §5).
 *
 * The console never creates or confirms a payment intent — that is the merchant's own
 * server or checkout page, with an api key or a client secret. The console only inspects
 * them and finishes a manual capture.
 */
export class PaymentIntentsEndpoint extends ResourceEndpoint<PaymentIntent, PaymentIntentListQuery> {
  protected readonly basePath = '/payment_intents';

  constructor(client: HttpTransport) {
    super(client);
  }

  /**
   * Manual-capture completion. `amount_minor` may be omitted for a full capture; when
   * present it must be <= the authorised amount or payzeno-api answers `400 amount_too_large`.
   */
  capture(
    paymentIntentId: string,
    req: CapturePaymentIntentRequest,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<PaymentIntentResponse> {
    return this.client.post<PaymentIntentResponse, CapturePaymentIntentRequest>(
      this.resourcePath(paymentIntentId, 'capture'),
      req,
      idempotencyKey,
    );
  }

  /**
   * Voids the authorisation. A void is not a refund (domain-model.md §4) — an uncaptured
   * charge cannot go through `POST /v1/refunds` at all.
   */
  cancel(
    paymentIntentId: string,
    req: CancelPaymentIntentRequest,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<PaymentIntentResponse> {
    return this.client.post<PaymentIntentResponse, CancelPaymentIntentRequest>(
      this.resourcePath(paymentIntentId, 'cancel'),
      req,
      idempotencyKey,
    );
  }
}
