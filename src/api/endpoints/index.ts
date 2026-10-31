/**
 * The ONE construction site for endpoints.
 *
 * `createEndpoints(transport)` is called exactly once, by `app/TransportProvider.tsx`, with
 * either `ApiClient` or `MockTransport`. Every `<f>.queries.ts` receives the resulting
 * registry as an argument, so the `?mock=1` swap reaches every call site in the app with no
 * per-feature branching at all.
 */
import type { HttpTransport } from '../transport';

import { ApiKeysEndpoint } from './api-keys.endpoint';
import { AuthEndpoint } from './auth.endpoint';
import { BalanceEndpoint } from './balance.endpoint';
import { BankAccountsEndpoint } from './bank-accounts.endpoint';
import { ChargesEndpoint } from './charges.endpoint';
import { CustomersEndpoint } from './customers.endpoint';
import { DisputesEndpoint } from './disputes.endpoint';
import { InvoicesEndpoint } from './invoices.endpoint';
import { OnboardingEndpoint } from './onboarding.endpoint';
import { PaymentIntentsEndpoint } from './payment-intents.endpoint';
import { PayoutsEndpoint } from './payouts.endpoint';
import { PricesEndpoint } from './prices.endpoint';
import { RefundsEndpoint } from './refunds.endpoint';
import { ReportingEndpoint } from './reporting.endpoint';
import { ReviewsEndpoint } from './reviews.endpoint';
import { SettlementsEndpoint } from './settlements.endpoint';
import { SignupEndpoint } from './signup.endpoint';
import { SubscriptionsEndpoint } from './subscriptions.endpoint';
import { WebhookEndpointsEndpoint } from './webhook-endpoints.endpoint';
import { WebhookEventsEndpoint } from './webhook-events.endpoint';

export interface EndpointRegistry {
  paymentIntents: PaymentIntentsEndpoint;
  charges: ChargesEndpoint;
  refunds: RefundsEndpoint;
  disputes: DisputesEndpoint;
  payouts: PayoutsEndpoint;
  settlements: SettlementsEndpoint;
  invoices: InvoicesEndpoint;
  webhookEvents: WebhookEventsEndpoint;
  apiKeys: ApiKeysEndpoint;
  bankAccounts: BankAccountsEndpoint;
  auth: AuthEndpoint;
  balance: BalanceEndpoint;
  reporting: ReportingEndpoint;
  webhookEndpoints: WebhookEndpointsEndpoint;
  // RFC platform-v2. Added at the end so the original fourteen keep their order.
  signup: SignupEndpoint;
  onboarding: OnboardingEndpoint;
  customers: CustomersEndpoint;
  prices: PricesEndpoint;
  subscriptions: SubscriptionsEndpoint;
  reviews: ReviewsEndpoint;
}

export function createEndpoints(client: HttpTransport): EndpointRegistry {
  return {
    paymentIntents: new PaymentIntentsEndpoint(client),
    charges: new ChargesEndpoint(client),
    refunds: new RefundsEndpoint(client),
    disputes: new DisputesEndpoint(client),
    payouts: new PayoutsEndpoint(client),
    settlements: new SettlementsEndpoint(client),
    invoices: new InvoicesEndpoint(client),
    webhookEvents: new WebhookEventsEndpoint(client),
    apiKeys: new ApiKeysEndpoint(client),
    bankAccounts: new BankAccountsEndpoint(client),
    auth: new AuthEndpoint(client),
    balance: new BalanceEndpoint(client),
    reporting: new ReportingEndpoint(client),
    webhookEndpoints: new WebhookEndpointsEndpoint(client),
    signup: new SignupEndpoint(client),
    onboarding: new OnboardingEndpoint(client),
    customers: new CustomersEndpoint(client),
    prices: new PricesEndpoint(client),
    subscriptions: new SubscriptionsEndpoint(client),
    reviews: new ReviewsEndpoint(client),
  };
}

export { ApiKeysEndpoint } from './api-keys.endpoint';
export { AuthEndpoint } from './auth.endpoint';
export { BalanceEndpoint } from './balance.endpoint';
export { BankAccountsEndpoint } from './bank-accounts.endpoint';
export { ChargesEndpoint } from './charges.endpoint';
export { CustomersEndpoint } from './customers.endpoint';
export { DisputesEndpoint } from './disputes.endpoint';
export { InvoicesEndpoint } from './invoices.endpoint';
export { OnboardingEndpoint } from './onboarding.endpoint';
export { PaymentIntentsEndpoint } from './payment-intents.endpoint';
export { PayoutsEndpoint } from './payouts.endpoint';
export { PricesEndpoint } from './prices.endpoint';
export { RefundsEndpoint } from './refunds.endpoint';
export { ReportingEndpoint } from './reporting.endpoint';
export { ReviewsEndpoint } from './reviews.endpoint';
export { SettlementsEndpoint } from './settlements.endpoint';
export { SignupEndpoint } from './signup.endpoint';
export { SubscriptionsEndpoint } from './subscriptions.endpoint';
export { WebhookEndpointsEndpoint } from './webhook-endpoints.endpoint';
export { WebhookEventsEndpoint } from './webhook-events.endpoint';
export { ResourceEndpoint } from './base';
