/**
 * `useSubmitEvidence()` — `POST /v1/disputes/:disputeId/evidence` (api-surface.md §12).
 *
 * Submitting is one-way. Once the packet reaches the network the merchant cannot amend it,
 * so the form saves drafts (`submit: false`) freely and submits once, deliberately.
 *
 * `422 dispute_window_closed` is the failure that actually happens: the merchant had the tab
 * open when `evidence_due_by` passed. It is not a validation error the user can fix, so it
 * refetches the dispute and lets the page re-render as closed instead of leaving a red field.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import type { Dispute, DisputeEvidence } from '@payzeno/contracts';

import { ConsoleApiError, ForbiddenError, ValidationApiError } from '@api/errors';
import { queryKeys } from '@api/queryKeys';
import { useEndpoints } from '@app/ApiContext';
import { useToast } from '@app/ToastProvider';
import { trackEvent } from '@lib/telemetry';

import { submitEvidenceMutation } from './disputes.queries';

export interface SubmitEvidenceArgs {
  disputeId: string;
  evidence: DisputeEvidence;
  /** False saves a draft. True sends it to the network and cannot be undone. */
  submit: boolean;
}

export interface UseSubmitEvidenceResult {
  submitEvidence: (args: SubmitEvidenceArgs) => void;
  isPending: boolean;
  /** True after a successful `submit: true`. The form locks itself on it. */
  isSubmitted: boolean;
  windowClosed: boolean;
  errorMessage: string | null;
  fieldErrors: Record<string, string>;
}

export function useSubmitEvidence(): UseSubmitEvidenceResult {
  const endpoints = useEndpoints();
  const toast = useToast();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const submitEvidence = useCallback(
    ({ disputeId, evidence, submit }: SubmitEvidenceArgs) => {
      mutation.mutate({ disputeId, request: { evidence, submit } });
    },
    [mutation],
  );

  return {
    submitEvidence,
    isPending: mutation.isPending,
    isSubmitted,
    windowClosed,
    errorMessage,
    fieldErrors,
  };
}
