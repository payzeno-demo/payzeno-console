/**
 * `useOnboarding()` — `GET /v1/onboarding` (RFC platform-v2 §3).
 *
 * `editable` is the one rule every onboarding form obeys: the merchant can change their answers
 * while Payzeno is waiting on them (`collecting`, `needs_info`) and not while staff are looking
 * at them or after a decision.
 */
import { useQuery } from '@tanstack/react-query';

import type { Onboarding, OnboardingRequirement } from '@payzeno/contracts';

import { useEndpoints } from '@app/ApiContext';

import { onboardingQuery } from './onboarding.queries';

export interface UseOnboardingResult {
  onboarding: Onboarding | undefined;
  /** `collecting` or `needs_info`. */
  editable: boolean;
  /** Editable, and nothing left in `requirements_due`. */
  canSubmit: boolean;
  isDue: (requirement: OnboardingRequirement) => boolean;
  isLoading: boolean;
  error: Error | null;
}

export function isEditable(onboarding: Pick<Onboarding, 'state'> | undefined): boolean {
  return onboarding?.state === 'collecting' || onboarding?.state === 'needs_info';
}

export function useOnboarding(options: { enabled?: boolean } = {}): UseOnboardingResult {
  const endpoints = useEndpoints();
  const query = useQuery({ ...onboardingQuery(endpoints), enabled: options.enabled ?? true });

  const onboarding = query.data;
  const editable = isEditable(onboarding);

  return {
    onboarding,
    editable,
    canSubmit: editable && (onboarding?.requirements_due.length ?? 1) === 0,
    isDue: (requirement) => onboarding?.requirements_due.includes(requirement) ?? true,
    isLoading: query.isLoading,
    error: (query.error as Error | null) ?? null,
  };
}
