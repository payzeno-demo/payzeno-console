import type {
  Dispute,
  DisputeResponse,
  DisputeStatus,
  ListQuery,
  SubmitDisputeEvidenceRequest,
} from '@payzeno/contracts';

import { newIdempotencyKey } from '../http/idempotency';
import type { HttpTransport } from '../transport';

import { ResourceEndpoint } from './base';

export interface DisputeListQuery extends ListQuery {
  status?: DisputeStatus;
}

/**
 * `GET /v1/disputes`, `GET /v1/disputes/:disputeId`,
 * `POST /v1/disputes/:disputeId/evidence` (api-surface.md §7).
 *
 * `POST /v1/disputes/:disputeId/accept` is `staff`-only and is deliberately absent — a
 * merchant cannot accept its own dispute from this console.
 */
export class DisputesEndpoint extends ResourceEndpoint<Dispute, DisputeListQuery> {
  protected readonly basePath = '/disputes';

  constructor(client: HttpTransport) {
    super(client);
  }

  /**
   * `submit: false` stages evidence without sending it to the network — the "save draft"
   * button in `EvidenceForm`. `422 dispute_window_closed` when `evidence_due_by` has passed.
   */
  submitEvidence(
    disputeId: string,
    req: SubmitDisputeEvidenceRequest,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<DisputeResponse> {
    return this.client.post<DisputeResponse, SubmitDisputeEvidenceRequest>(
      this.resourcePath(disputeId, 'evidence'),
      req,
      idempotencyKey,
    );
  }

  listNeedingResponse(q?: ListQuery) {
    return this.list({ ...(q ?? {}), status: 'needs_response' });
  }
}
