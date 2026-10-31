/**
 * `useSubmitOnboarding()` — `POST /v1/onboarding/submit` (RFC platform-v2 §3).
 *
 * `collecting` / `needs_info` → `submitted`. The merchant stays `pending_review` until a
 * Payzeno analyst decides, and hears about it by email (`onboarding_approved`, …) — the page
 * picks the decision up on its next read.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { Onboarding } from '@payzeno/contracts';

import { ConflictApiError, ConsoleApiError } from '@api/errors';
import { queryKeys } from '@api/queryKeys';
import { useEndpoints } from '@app/ApiContext';
import { useToast } from '@app/ToastProvider';

import { REQUIREMENT_LABELS } from './onboarding.copy';
import { submitOnboardingMutation } from './onboarding.queries';

export interface UseSubmitOnboardingResult {
  submit: () => void;
  isPending: boolean;
  errorMessage: string | null;
}

/**
 * `409 invalid_state` carries `details.reason`: `requirements_due` (with the list, comma
 * separated) when a step is missing, anything else when the application is not in a state that
 * can be submitted — typically already submitted from another tab.
 */
function conflictMessage(details: Record<string, unknown>): string {
  if (details.reason === 'requirements_due') {
    const due = typeof details.requirements_due === 'string' ? details.requirements_due : '';
    const labels = due
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) =>
        item in REQUIREMENT_LABELS
          ? REQUIREMENT_LABELS[item as keyof typeof REQUIREMENT_LABELS]
          : item,
      );
    return labels.length > 0
      ? `Still missing: ${labels.join(', ')}. Complete those steps, then submit again.`
      : 'Something is still missing. Complete every step above, then submit again.';
  }
  return 'This application cannot be submitted right now — it may already be with our team. Reload to see its status.';
}

export function useSubmitOnboarding(): UseSubmitOnboardingResult {
  const endpoints = useEndpoints();
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    ...submitOnboardingMutation(endpoints),
    onSuccess: async (onboarding: Onboarding) => {
      queryClient.setQueryData(queryKeys.onboarding.current(), onboarding);
      toast.success('Submitted for review. We will email you when there is a decision.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.session.all }),
      ]);
    },
  });
  const { mutate } = mutation;

  const submit = useCallback(() => mutate(), [mutate]);

  let errorMessage: string | null = null;
  if (mutation.error instanceof ConflictApiError) {
    errorMessage = conflictMessage(mutation.error.details);
  } else if (mutation.error instanceof ConsoleApiError) {
    errorMessage = mutation.error.message;
  } else if (mutation.error) {
    errorMessage = 'Your application could not be submitted. Try again in a moment.';
  }

  return { submit, isPending: mutation.isPending, errorMessage };
}
