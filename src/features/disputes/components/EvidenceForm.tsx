/**
 * Evidence packet form, v1. Still the default; `EvidenceFormV2` is behind the
 * `dispute_evidence_v2` flag.
 *
 * Every field maps 1:1 onto `DisputeEvidence`, which is what the card network's packet
 * expects. There is no free-form "attach anything" box beyond `uncategorized_text`, because
 * an unstructured packet loses.
 *
 * a11y: every input has a label, field errors are wired through `aria-describedby`, and the
 * submit control spells out that submission is final.
 */
import { useState } from 'react';
import type { FormEvent } from 'react';

import type { DisputeEvidence } from '@payzeno/contracts';

import { InlineError } from '@components/feedback/InlineError';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Label } from '@components/ui/Label';
import { Textarea } from '@components/ui/Textarea';
import { fieldErrorId, fieldId } from '@lib/ids';

export interface EvidenceFormProps {
  disputeId: string;
  initialEvidence: DisputeEvidence;
  disabled: boolean;
  isPending: boolean;
  isSubmitted: boolean;
  errorMessage: string | null;
  fieldErrors: Record<string, string>;
  onSave: (evidence: DisputeEvidence, submit: boolean) => void;
}

const FORM = 'evidence';

export function EvidenceForm({
  disputeId,
  initialEvidence,
  disabled,
  isPending,
  isSubmitted,
  errorMessage,
  fieldErrors,
  onSave,
}: EvidenceFormProps) {
  const [evidence, setEvidence] = useState<DisputeEvidence>(initialEvidence);

  const set = <TKey extends keyof DisputeEvidence>(key: TKey, value: DisputeEvidence[TKey]) => {
    setEvidence((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled || isPending) return;
    onSave(evidence, true);
  };

  const errorFor = (field: string) => fieldErrors[`evidence.${field}`];

  return (
    <form onSubmit={handleSubmit} noValidate aria-labelledby={`${FORM}-heading`}>
      <h2 id={`${FORM}-heading`}>Evidence for {disputeId}</h2>

      {errorMessage ? (
        <p role="alert" data-testid="evidence-error">
          {errorMessage}
        </p>
      ) : null}

      <Label htmlFor={fieldId(FORM, 'product_description')}>What was sold</Label>
      <Textarea
        id={fieldId(FORM, 'product_description')}
        name="product_description"
        rows={3}
        value={evidence.product_description ?? ''}
        disabled={disabled}
        aria-describedby={
          errorFor('product_description') ? fieldErrorId(FORM, 'product_description') : undefined
        }
        onChange={(event) => set('product_description', event.target.value)}
      />
      {errorFor('product_description') ? (
        <InlineError id={fieldErrorId(FORM, 'product_description')}>
          {errorFor('product_description')}
        </InlineError>
      ) : null}

      <Label htmlFor={fieldId(FORM, 'customer_name')}>Customer name</Label>
      <Input
        id={fieldId(FORM, 'customer_name')}
        name="customer_name"
        value={evidence.customer_name ?? ''}
        disabled={disabled}
        onChange={(event) => set('customer_name', event.target.value)}
      />

      <Label htmlFor={fieldId(FORM, 'customer_email')}>Customer email</Label>
      <Input
        id={fieldId(FORM, 'customer_email')}
        name="customer_email"
        type="email"
        value={evidence.customer_email ?? ''}
        disabled={disabled}
        aria-describedby={
          errorFor('customer_email') ? fieldErrorId(FORM, 'customer_email') : undefined
        }
        onChange={(event) => set('customer_email', event.target.value)}
      />
      {errorFor('customer_email') ? (
        <InlineError id={fieldErrorId(FORM, 'customer_email')}>
          {errorFor('customer_email')}
        </InlineError>
      ) : null}

      <Label htmlFor={fieldId(FORM, 'shipping_tracking_number')}>Tracking number</Label>
      <Input
        id={fieldId(FORM, 'shipping_tracking_number')}
