/**
 * The ONE construction site for the admin app's endpoints — the admin twin of
 * `api/endpoints/index.ts`. `AdminTransportProvider` calls it once, with `ApiClient` (pointed
 * at this host's `/v1`) or with `AdminMockTransport` under `?mock=1`, and every
 * `admin/features/<f>/<f>.queries.ts` receives the registry as an argument (ADR 0002, 0004).
 */
import type { HttpTransport } from '@api/transport';

import { AdminDisputesEndpoint } from './admin-disputes.endpoint';
import { AdminMerchantsEndpoint } from './admin-merchants.endpoint';
import { AdminReviewsEndpoint } from './admin-reviews.endpoint';
import { AdminSettlementsEndpoint } from './admin-settlements.endpoint';
import { AdminSupportEndpoint } from './admin-support.endpoint';
import { StaffAuthEndpoint } from './staff-auth.endpoint';

export interface AdminEndpointRegistry {
  staffAuth: StaffAuthEndpoint;
  merchants: AdminMerchantsEndpoint;
  reviews: AdminReviewsEndpoint;
  disputes: AdminDisputesEndpoint;
  settlements: AdminSettlementsEndpoint;
  support: AdminSupportEndpoint;
}

export interface AdminEndpointOptions {
  /** Versioned API base the transport talks to. Only used to build document links. */
  apiBaseUrl: string;
}

export function createAdminEndpoints(
  client: HttpTransport,
  options: AdminEndpointOptions,
): AdminEndpointRegistry {
  return {
    staffAuth: new StaffAuthEndpoint(client),
    merchants: new AdminMerchantsEndpoint(client, options.apiBaseUrl),
    reviews: new AdminReviewsEndpoint(client),
    disputes: new AdminDisputesEndpoint(client),
    settlements: new AdminSettlementsEndpoint(client),
    support: new AdminSupportEndpoint(client),
  };
}

export { AdminDisputesEndpoint } from './admin-disputes.endpoint';
export { AdminMerchantsEndpoint } from './admin-merchants.endpoint';
export { AdminReviewsEndpoint } from './admin-reviews.endpoint';
export { AdminSettlementsEndpoint } from './admin-settlements.endpoint';
export { AdminSupportEndpoint } from './admin-support.endpoint';
export { StaffAuthEndpoint } from './staff-auth.endpoint';
