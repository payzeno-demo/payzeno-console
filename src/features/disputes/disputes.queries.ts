/**
 * Query/mutation factories for `features/disputes`. The ONLY caller of `DisputesEndpoint`.
 *
 * `POST /v1/disputes/:id/accept` is staff-only and has no factory here on purpose — a
 * merchant cannot accept its own dispute from this console, and a factory for a route the
 * session can never call is a trap for whoever wires the next button.
 */
import { queryOptions } from '@tanstack/react-query';

import type {
  Dispute,
  Paginated,
  SubmitDisputeEvidenceRequest,
} from '@payzeno/contracts';

