import type {
  AdminMerchantDetail,
  AdminMerchantListQuery,
  AdminMerchantStatusRequest,
  AdminMerchantSummary,
  Merchant,
  OnboardingDecisionRequest,
  Paginated,
} from '@payzeno/contracts';

import { newIdempotencyKey } from '@api/http/idempotency';
import { joinPath, pathSegment } from '@api/http/request-builder';
import type { HttpTransport } from '@api/transport';

import { adminQueryParams } from './params';

export type OnboardingDecision = 'approve' | 'reject' | 'request-info';

/**
 * What a merchant mutation answers with. The RFC names the routes but not their bodies, and the
 * api may return either the refreshed detail or the bare merchant. The admin app only reads the
 * merchant's status off it (and then refetches the detail anyway), so it accepts both.
 */
export type AdminMerchantMutationResult = AdminMerchantDetail | Merchant;

export function merchantOf(result: AdminMerchantMutationResult): Merchant {
  return result.object === 'merchant' ? result : result.merchant;
}

/**
 * `GET /v1/admin/merchants`, `GET /v1/admin/merchants/:id`,
 * `GET /v1/admin/merchants/:id/documents/:doc/content`,
 * `POST /v1/admin/merchants/:id/onboarding/{approve|reject|request-info}`,
 * `POST /v1/admin/merchants/:id/status` (RFC platform-v2 §1).
 *
 * Cross-tenant: there is no merchant scope on any of these, and every POST writes
 * `staff_audit_log` on the api side.
 */
export class AdminMerchantsEndpoint {
  private readonly basePath = '/admin/merchants';

  constructor(
    private readonly client: HttpTransport,
    /** The versioned base the transport talks to — documents are opened as plain links. */
    private readonly apiBaseUrl: string,
  ) {}

  list(q?: AdminMerchantListQuery): Promise<Paginated<AdminMerchantSummary>> {
    return this.client.get<Paginated<AdminMerchantSummary>>(this.basePath, adminQueryParams(q));
  }

  get(merchantId: string): Promise<AdminMerchantDetail> {
    return this.client.get<AdminMerchantDetail>(this.merchantPath(merchantId));
  }

  /** `message` is required by the api for `reject` and `request-info`; it reaches the merchant. */
  decide(
    merchantId: string,
    decision: OnboardingDecision,
    req: OnboardingDecisionRequest,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<AdminMerchantMutationResult> {
    return this.client.post<AdminMerchantMutationResult, OnboardingDecisionRequest>(
      this.merchantPath(merchantId, 'onboarding', decision),
      req,
      idempotencyKey,
    );
  }

  setStatus(
    merchantId: string,
    req: AdminMerchantStatusRequest,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<AdminMerchantMutationResult> {
    return this.client.post<AdminMerchantMutationResult, AdminMerchantStatusRequest>(
      this.merchantPath(merchantId, 'status'),
      req,
      idempotencyKey,
    );
  }

  /**
   * A KYC document's bytes. Not fetched through the transport: the api streams the file with
   * its own content type, and the browser opening the URL in a tab (same origin, so the staff
   * cookie rides along) is both the viewer and the download. No document byte ever passes
   * through the JSON pipeline, the query cache or a log line.
   */
  documentContentUrl(merchantId: string, documentId: string): string {
    return joinPath(
      this.apiBaseUrl,
      this.merchantPath(merchantId, 'documents', pathSegment(documentId), 'content'),
    );
  }

  private merchantPath(merchantId: string, ...suffix: string[]): string {
    const tail = suffix.length > 0 ? `/${suffix.join('/')}` : '';
    return `${this.basePath}/${pathSegment(merchantId)}${tail}`;
  }
}
