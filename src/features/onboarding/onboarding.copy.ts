/**
 * The words onboarding uses, in one place: the checklist on Home and the onboarding page must
 * name the same steps the same way.
 */
import type {
  BusinessType,
  KycDocumentType,
  OnboardingRequirement,
  OnboardingState,
} from '@payzeno/contracts';

export const REQUIREMENT_LABELS: Readonly<Record<OnboardingRequirement, string>> = {
  business_profile: 'Business details',
  representative: 'Account representative',
  bank_account: 'Bank account for payouts',
  identity_document: 'Identity document',
};

export const STATE_LABELS: Readonly<Record<OnboardingState, string>> = {
  collecting: 'Setting up',
  submitted: 'In review',
  needs_info: 'More information needed',
  approved: 'Verified',
  rejected: 'Not approved',
};

export const BUSINESS_TYPE_LABELS: Readonly<Record<BusinessType, string>> = {
  individual: 'Individual / sole trader',
  company: 'Company',
  non_profit: 'Non-profit',
};

export const DOCUMENT_TYPE_LABELS: Readonly<Record<KycDocumentType, string>> = {
  identity_document: 'Identity document (passport or ID card)',
  proof_of_address: 'Proof of address',
  company_registration: 'Company registration certificate',
  bank_statement: 'Bank statement',
};

export const TEST_MODE_ONLY = 'Test mode only until we verify your business';
