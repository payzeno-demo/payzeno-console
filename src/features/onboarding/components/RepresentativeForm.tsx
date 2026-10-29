/**
 * Step 2 of onboarding: the person responsible for the account (`Representative`).
 */
import { useState } from 'react';
import type { FormEvent } from 'react';

import type { Representative, UpdateOnboardingRequest } from '@payzeno/contracts';

import { InlineError } from '@components/feedback/InlineError';
import { TextField } from '@components/form/TextField';
import { Button } from '@components/ui/Button';

export interface RepresentativeFormProps {
  representative: Representative;
  editable: boolean;
  onSave: (request: UpdateOnboardingRequest) => void;
  isPending: boolean;
  errorMessage: string | null;
  fieldErrors: Record<string, string>;
}

export function RepresentativeForm({
  representative,
  editable,
  onSave,
  isPending,
  errorMessage,
  fieldErrors,
}: RepresentativeFormProps) {
  const [fullName, setFullName] = useState(representative.full_name ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(representative.date_of_birth ?? '');
  const [email, setEmail] = useState(representative.email ?? '');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editable || isPending) return;

    const next: Partial<Representative> = {};
    if (fullName.trim()) next.full_name = fullName.trim();
    if (dateOfBirth) next.date_of_birth = dateOfBirth;
    if (email.trim()) next.email = email.trim();
    onSave({ representative: next });
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Account representative">
      {errorMessage ? <InlineError id="representative-error">{errorMessage}</InlineError> : null}

      <TextField
        id="representative-name"
        label="Full legal name"
        autoComplete="name"
        disabled={!editable}
        value={fullName}
        onValueChange={setFullName}
        error={fieldErrors.full_name}
      />
      <TextField
        id="representative-dob"
        label="Date of birth"
        type="date"
        autoComplete="bday"
        disabled={!editable}
        value={dateOfBirth}
        onValueChange={setDateOfBirth}
        error={fieldErrors.date_of_birth}
      />
      <TextField
        id="representative-email"
        label="Email"
        type="email"
        autoComplete="email"
        disabled={!editable}
        value={email}
        onValueChange={setEmail}
        error={fieldErrors.email}
      />

      {editable ? (
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save representative'}
        </Button>
      ) : null}
    </form>
  );
}
