/**
 * Step 1 of onboarding: the business itself (RFC platform-v2 §3, `BusinessProfile`).
 *
 * The draft is local view state seeded from the server copy — the server copy itself lives
 * only in the query cache (ADR 0001). `OnboardingPage` remounts this form when the saved
 * profile changes, so a save that the api normalised (a trimmed URL) shows what was stored.
 */
import { useState } from 'react';
import type { FormEvent } from 'react';

import { BUSINESS_TYPES } from '@payzeno/contracts';
import type { BusinessProfile, BusinessType, UpdateOnboardingRequest } from '@payzeno/contracts';

import { InlineError } from '@components/feedback/InlineError';
import { FormField } from '@components/form/FormField';
import { TextField } from '@components/form/TextField';
import { Button } from '@components/ui/Button';
import { Select } from '@components/ui/Select';
import { Textarea } from '@components/ui/Textarea';

import { BUSINESS_TYPE_LABELS } from '../onboarding.copy';

type TextKey = Exclude<keyof BusinessProfile, 'business_type'>;

export interface BusinessProfileFormProps {
  profile: BusinessProfile;
  editable: boolean;
  onSave: (request: UpdateOnboardingRequest) => void;
  isPending: boolean;
  errorMessage: string | null;
  fieldErrors: Record<string, string>;
}

function draftOf(profile: BusinessProfile): Record<TextKey, string> {
  return {
    website: profile.website ?? '',
    product_description: profile.product_description ?? '',
    support_email: profile.support_email ?? '',
    address_line1: profile.address_line1 ?? '',
    city: profile.city ?? '',
    postal_code: profile.postal_code ?? '',
    registration_number: profile.registration_number ?? '',
  };
}

export function BusinessProfileForm({
  profile,
  editable,
  onSave,
  isPending,
  errorMessage,
  fieldErrors,
}: BusinessProfileFormProps) {
  const [draft, setDraft] = useState(() => draftOf(profile));
  const [businessType, setBusinessType] = useState<BusinessType | null>(profile.business_type);

  const set = (key: TextKey) => (value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editable || isPending) return;

    // Empty fields are left out rather than sent as "": the api's validators treat a present
    // empty string as an answer, and "no answer yet" is what the merchant means.
    const business_profile: Partial<BusinessProfile> = {};
    if (businessType) business_profile.business_type = businessType;
    for (const [key, value] of Object.entries(draft) as Array<[TextKey, string]>) {
      if (value.trim().length > 0) business_profile[key] = value.trim();
    }
    onSave({ business_profile });
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Business details">
      {errorMessage ? <InlineError id="business-profile-error">{errorMessage}</InlineError> : null}

      <Select<BusinessType>
        id="business-type"
        label="Business type"
        value={businessType}
        placeholder="Choose one…"
        disabled={!editable}
        onValueChange={setBusinessType}
        options={BUSINESS_TYPES.map((value) => ({ value, label: BUSINESS_TYPE_LABELS[value] }))}
        invalid={Boolean(fieldErrors.business_type)}
        errorId="business-type-error"
      />
      {fieldErrors.business_type ? (
        <InlineError id="business-type-error">{fieldErrors.business_type}</InlineError>
      ) : null}

      <TextField
        id="business-website"
        label="Website"
        type="url"
        placeholder="https://"
        disabled={!editable}
        value={draft.website}
        onValueChange={set('website')}
        error={fieldErrors.website}
      />

      <FormField
        id="business-description"
        label="What do you sell?"
        hint="A sentence or two. Our risk team reads this against your website."
        error={fieldErrors.product_description}
      >
        {(wiring) => (
          <Textarea
            id={wiring.id}
            describedBy={wiring['aria-describedby']}
            invalid={Boolean(fieldErrors.product_description)}
            disabled={!editable}
            maxLength={1000}
            value={draft.product_description}
            onChange={(event) => set('product_description')(event.target.value)}
          />
        )}
      </FormField>

      <TextField
        id="business-support-email"
        label="Customer support email"
        type="email"
        disabled={!editable}
        value={draft.support_email}
        onValueChange={set('support_email')}
        error={fieldErrors.support_email}
      />

      <TextField
        id="business-address"
        label="Business address"
        autoComplete="address-line1"
        disabled={!editable}
        value={draft.address_line1}
        onValueChange={set('address_line1')}
        error={fieldErrors.address_line1}
      />
      <TextField
        id="business-city"
        label="City"
        autoComplete="address-level2"
        disabled={!editable}
        value={draft.city}
        onValueChange={set('city')}
        error={fieldErrors.city}
      />
      <TextField
        id="business-postal-code"
        label="Postal code"
        autoComplete="postal-code"
        disabled={!editable}
        value={draft.postal_code}
        onValueChange={set('postal_code')}
        error={fieldErrors.postal_code}
      />
      <TextField
        id="business-registration"
        label="Registration or tax number"
        hint="Company number, VAT/EIN, or the equivalent where you are registered."
        disabled={!editable}
        value={draft.registration_number}
        onValueChange={set('registration_number')}
        error={fieldErrors.registration_number}
      />

      {editable ? (
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save business details'}
        </Button>
      ) : null}
    </form>
  );
}
