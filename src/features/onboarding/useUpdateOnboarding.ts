/**
 * `useUpdateOnboarding()` — `PATCH /v1/onboarding` (RFC platform-v2 §3).
 *
 * Business profile and representative are saved separately (one PATCH each, each carrying
 * only its own half) so a validation error on one never throws away typing in the other.
 * The response is the whole `Onboarding`, so it goes straight into the cache: the checklist's
 * `requirements_due` updates without a second request.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import type { Onboarding, UpdateOnboardingRequest } from '@payzeno/contracts';

import { ConsoleApiError, ValidationApiError } from '@api/errors';
import { queryKeys } from '@api/queryKeys';
import { useEndpoints } from '@app/ApiContext';
import { useToast } from '@app/ToastProvider';

import { updateOnboardingMutation } from './onboarding.queries';

export interface UseUpdateOnboardingResult {
  save: (request: UpdateOnboardingRequest) => void;
  isPending: boolean;
  errorMessage: string | null;
  /** Keyed by the api's dotted path minus the section: `website`, `full_name`. */
  fieldErrors: Record<string, string>;
}

/** `business_profile.website` → `website`. The section is implied by which form is saving. */
function stripSection(fieldErrors: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, message] of Object.entries(fieldErrors)) {
    const leaf = path.split('.').pop() ?? path;
    out[leaf] = message;
  }
  return out;
}

export function useUpdateOnboarding(successMessage: string): UseUpdateOnboardingResult {
  const endpoints = useEndpoints();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    ...updateOnboardingMutation(endpoints),
    onMutate: () => {
      setErrorMessage(null);
      setFieldErrors({});
    },
    onSuccess: async (onboarding: Onboarding) => {
      queryClient.setQueryData(queryKeys.onboarding.current(), onboarding);
      toast.success(successMessage);
      await queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.all });
    },
    onError: (error: unknown) => {
      if (error instanceof ValidationApiError) {
        setFieldErrors(stripSection(error.fieldErrorMap()));
        setErrorMessage('Check the highlighted fields.');
        return;
      }
      setErrorMessage(
        error instanceof ConsoleApiError
          ? error.message
          : 'Your changes could not be saved. Try again in a moment.',
      );
    },
  });

  const save = useCallback(
    (request: UpdateOnboardingRequest) => mutation.mutate(request),
    [mutation],
  );

  return { save, isPending: mutation.isPending, errorMessage, fieldErrors };
}
