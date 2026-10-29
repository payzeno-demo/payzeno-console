import type {
  KycDocument,
  Onboarding,
  UpdateOnboardingRequest,
  UploadKycDocumentRequest,
} from '@payzeno/contracts';

import { LONG_READ_TIMEOUT_MS } from '@config/constants';

import { newIdempotencyKey } from '../http/idempotency';
import type { HttpTransport } from '../transport';

/** Decoded size cap for one KYC document (RFC platform-v2 §3). payzeno-api enforces it too. */
export const KYC_DOCUMENT_MAX_BYTES = 600 * 1024;

/**
 * `GET /v1/onboarding`, `PATCH /v1/onboarding`, `POST /v1/onboarding/documents`,
 * `POST /v1/onboarding/submit` (RFC platform-v2 §3).
 *
 * Onboarding is a singleton per merchant — the session's merchant — so this is a plain class
 * like `BalanceEndpoint`, not a `ResourceEndpoint` with a `list()` that would lie.
 *
 * Documents are write-only from here: the merchant uploads, Payzeno staff read them through
 * the admin API. Nothing on this class can fetch a document's bytes back.
 */
export class OnboardingEndpoint {
  constructor(private readonly client: HttpTransport) {}

  get(): Promise<Onboarding> {
    return this.client.get<Onboarding>('/onboarding');
  }

  update(
    req: UpdateOnboardingRequest,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<Onboarding> {
    return this.client.patch<Onboarding, UpdateOnboardingRequest>(
      '/onboarding',
      req,
      idempotencyKey,
    );
  }

  /**
   * Base64 in a JSON body (≤ 600 KB decoded, so ~800 KB on the wire). Sent through
   * `request()` with the long read timeout because the api writes to S3 before it answers.
   */
  uploadDocument(
    req: UploadKycDocumentRequest,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<KycDocument> {
    return this.client.request<KycDocument, UploadKycDocumentRequest>({
      method: 'POST',
      path: '/onboarding/documents',
      body: req,
      idempotencyKey,
      timeoutMs: LONG_READ_TIMEOUT_MS,
    });
  }

  /** `collecting` / `needs_info` → `submitted`. 409 `invalid_state` while requirements are due. */
  submit(idempotencyKey: string = newIdempotencyKey()): Promise<Onboarding> {
    return this.client.post<Onboarding, Record<string, never>>(
      '/onboarding/submit',
      {},
      idempotencyKey,
    );
  }
}
