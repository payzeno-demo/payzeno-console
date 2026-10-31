import type {
  CreateCustomerRequest,
  Customer,
  CustomerListQuery,
  Paginated,
  PaymentMethod,
  UpdateCustomerRequest,
} from '@payzeno/contracts';

import { pathSegment } from '../http/request-builder';
import { newIdempotencyKey } from '../http/idempotency';
import type { HttpTransport } from '../transport';

import { ResourceEndpoint } from './base';

/**
 * `GET/POST /v1/customers`, `GET/PATCH /v1/customers/:customerId`,
 * `GET /v1/customers/:customerId/payment_methods`,
 * `DELETE /v1/customers/:customerId/payment_methods/:paymentMethodId` (RFC platform-v2 §5).
 *
 * A saved card is a `PaymentMethod` (`pm_…`) wrapping a reusable vault token. The token never
 * leaves payzeno-api, so nothing here can carry one — the console sees a `CardSummary` and an
 * id, exactly as ADR 0003 requires.
 */
export class CustomersEndpoint extends ResourceEndpoint<Customer, CustomerListQuery> {
  protected readonly basePath = '/customers';

  constructor(client: HttpTransport) {
    super(client);
  }

  create(
    req: CreateCustomerRequest,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<Customer> {
    return this.client.post<Customer, CreateCustomerRequest>(this.basePath, req, idempotencyKey);
  }

  update(
    customerId: string,
    req: UpdateCustomerRequest,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<Customer> {
    return this.client.patch<Customer, UpdateCustomerRequest>(
      this.resourcePath(customerId),
      req,
      idempotencyKey,
    );
  }

  listPaymentMethods(customerId: string): Promise<Paginated<PaymentMethod>> {
    return this.client.get<Paginated<PaymentMethod>>(
      this.resourcePath(customerId, 'payment_methods'),
    );
  }

  /** 204. Detaches the card; a subscription that used it falls back to the customer default. */
  removePaymentMethod(
    customerId: string,
    paymentMethodId: string,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<void> {
    return this.client.delete(
      this.resourcePath(customerId, 'payment_methods', pathSegment(paymentMethodId)),
      idempotencyKey,
    );
  }
}
