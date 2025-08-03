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
import { DisputesEndpoint } from './disputes.endpoint';
import { InvoicesEndpoint } from './invoices.endpoint';
import { PaymentIntentsEndpoint } from './payment-intents.endpoint';
import { PayoutsEndpoint } from './payouts.endpoint';
import { RefundsEndpoint } from './refunds.endpoint';
import { ReportingEndpoint } from './reporting.endpoint';
import { SettlementsEndpoint } from './settlements.endpoint';
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
}

export { BankAccountsEndpoint } from './bank-accounts.endpoint';
export { PaymentIntentsEndpoint } from './payment-intents.endpoint';
export { RefundsEndpoint } from './refunds.endpoint';
