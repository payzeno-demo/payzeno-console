/**
 * The five merchant actions (RFC platform-v2 §1, `risk` acts):
 *
 *   approve        `POST …/onboarding/approve`       onboarding → approved, merchant → active,
 *                                                     owner emailed `onboarding_approved`
 *   reject         `POST …/onboarding/reject`        → rejected; message emailed to the owner
 *   request info   `POST …/onboarding/request-info`  → needs_info; message emailed to the owner
 *   restrict       `POST …/status` {restricted}      live payments stop; reason is audited
 *   reactivate     `POST …/status` {active}
 *
 * Every one refetches the whole merchant family — the detail, every filtered list, and the home
 * page's KYC count all read from it.
 */
import { labelise } from '@lib/format';

import { adminQueryKeys } from '../../api/adminQueryKeys';
import { merchantOf } from '../../api/endpoints/admin-merchants.endpoint';
import type { OnboardingDecision } from '../../api/endpoints/admin-merchants.endpoint';
import { useAdminEndpoints } from '../../app/AdminApiContext';
import { useStaffAction } from '../../hooks/useStaffAction';
import type { StaffActionResult } from '../../hooks/useStaffAction';

import { merchantDecisionMutation, merchantStatusMutation } from './merchants.queries';
import type { MerchantDecisionInput, MerchantStatusInput } from './merchants.queries';

const DECISION_OUTCOME: Readonly<Record<OnboardingDecision, { title: string; body: string }>> = {
  approve: {
    title: 'Onboarding approved',
    body: 'The merchant is active and can take live payments. The owner has been emailed.',
  },
  reject: {
    title: 'Onboarding rejected',
    body: 'The merchant has been rejected and the owner emailed your message.',
  },
  'request-info': {
    title: 'More information requested',
    body: 'The application is back with the merchant, and the owner has been emailed your message.',
  },
};

export function useMerchantDecision(): StaffActionResult<MerchantDecisionInput> {
  const endpoints = useAdminEndpoints();
  return useStaffAction({
    ...merchantDecisionMutation(endpoints),
    invalidate: () => [adminQueryKeys.merchants.all],
    success: (result, vars) => {
      const merchant = merchantOf(result);
      const copy = DECISION_OUTCOME[vars.decision];
      return {
        tone: vars.decision === 'reject' ? 'info' : 'success',
        title: `${copy.title}: ${merchant.display_name}`,
        body: `${copy.body} Merchant status is now ${labelise(merchant.status)}.`,
      };
    },
    forbidden: 'onboarding decisions need the risk role.',
    conflict: 'The application changed state since this page loaded.',
  });
}

export function useMerchantStatus(): StaffActionResult<MerchantStatusInput> {
  const endpoints = useAdminEndpoints();
  return useStaffAction({
    ...merchantStatusMutation(endpoints),
    invalidate: () => [adminQueryKeys.merchants.all],
    success: (result, vars) => {
      const merchant = merchantOf(result);
      return {
        tone: vars.status === 'active' ? 'success' : 'info',
        title:
          vars.status === 'active'
            ? `Merchant reactivated: ${merchant.display_name}`
            : `Merchant ${vars.status}: ${merchant.display_name}`,
        body: `Status is now ${labelise(merchant.status)}. Reason recorded in the staff audit log: “${vars.reason}”.`,
      };
    },
    forbidden: 'changing a merchant’s status needs the risk role.',
    conflict: 'The merchant’s status changed since this page loaded.',
  });
}
