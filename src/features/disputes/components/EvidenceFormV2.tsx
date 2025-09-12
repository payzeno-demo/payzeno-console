/**
 * Evidence packet form, v2 — behind the `dispute_evidence_v2` flag.
 *
 * The difference that matters is not the layout: v2 asks for the fields the network's win
 * rate actually correlates with **for this dispute's reason**, and hides the rest. A
 * `product_not_received` packet with a tracking number wins; the same packet with three
 * paragraphs of prose does not.
 *
 * Completeness is scored client-side and shown as a meter, because merchants submit half-empty
 * packets and then ask why they lost.
 */
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import type { DisputeEvidence, DisputeReason } from '@payzeno/contracts';

import { InlineError } from '@components/feedback/InlineError';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Label } from '@components/ui/Label';
import { Textarea } from '@components/ui/Textarea';
import { formatPercent } from '@lib/format';
import { fieldErrorId, fieldId } from '@lib/ids';

type EvidenceField = keyof DisputeEvidence;

const LABELS: Readonly<Record<EvidenceField, string>> = {
  product_description: 'What was sold',
  customer_name: 'Customer name',
  customer_email: 'Customer email',
  shipping_tracking_number: 'Tracking number',
  receipt_file_id: 'Receipt file id',
  service_documentation_file_id: 'Service documentation file id',
  uncategorized_text: 'Anything else',
};

const MULTILINE: ReadonlySet<EvidenceField> = new Set([
  'product_description',
  'uncategorized_text',
]);

const FORM = 'evidence-v2';

export function completeness(
  evidence: DisputeEvidence,
  fields: ReadonlyArray<EvidenceField>,
): number {
  if (fields.length === 0) return 1;
  const filled = fields.filter((field) => (evidence[field] ?? '').toString().trim().length > 0);
  return filled.length / fields.length;
}

export interface EvidenceFormV2Props {
  disputeId: string;
  reason: DisputeReason;
  initialEvidence: DisputeEvidence;
  disabled: boolean;
  isPending: boolean;
  isSubmitted: boolean;
  errorMessage: string | null;
  fieldErrors: Record<string, string>;
  onSave: (evidence: DisputeEvidence, submit: boolean) => void;
}

export function EvidenceFormV2({
  disputeId,
  reason,
  initialEvidence,
  disabled,
  isPending,
  isSubmitted,
  errorMessage,
  fieldErrors,
  onSave,
}: EvidenceFormV2Props) {
  const [evidence, setEvidence] = useState<DisputeEvidence>(initialEvidence);
  const fields = FIELDS_BY_REASON[reason];
  const score = useMemo(() => completeness(evidence, fields), [evidence, fields]);

  const set = (field: EvidenceField, value: string) => {
    setEvidence((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled || isPending) return;
    onSave(evidence, true);
  };

  return (
    <Card as="section" aria-labelledby={`${FORM}-heading`}>
      <form onSubmit={handleSubmit} noValidate>
        <h2 id={`${FORM}-heading`}>Evidence for {disputeId}</h2>
        <p>
          These are the fields that decide a <strong>{reason.replace(/_/g, ' ')}</strong> dispute.
        </p>

        <p role="status" aria-live="polite">
          Packet completeness: {formatPercent(score, 0)}
        </p>

        {errorMessage ? <p role="alert">{errorMessage}</p> : null}

        {fields.map((field) => {
          const error = fieldErrors[`evidence.${field}`];
          const inputId = fieldId(FORM, field);
          const errorId = fieldErrorId(FORM, field);

          return (
            <div key={field}>
              <Label htmlFor={inputId}>{LABELS[field]}</Label>
              {MULTILINE.has(field) ? (
                <Textarea
                  id={inputId}
                  name={field}
                  rows={4}
                  value={evidence[field] ?? ''}
                  disabled={disabled}
                  aria-describedby={error ? errorId : undefined}
                  onChange={(event) => set(field, event.target.value)}
                />
              ) : (
                <Input
                  id={inputId}
                  name={field}
                  value={evidence[field] ?? ''}
                  disabled={disabled}
                  aria-describedby={error ? errorId : undefined}
                  onChange={(event) => set(field, event.target.value)}
                />
              )}
              {error ? <InlineError id={errorId}>{error}</InlineError> : null}
            </div>
          );
        })}

        <div role="group" aria-label="Evidence actions">
          <Button
            type="button"
            variant="secondary"
            disabled={disabled || isPending}
            onClick={() => onSave(evidence, false)}
          >
            Save draft
          </Button>
          <Button type="submit" disabled={disabled || isPending || isSubmitted || score < 0.5}>
            {isPending ? 'Sending…' : 'Submit to the network'}
          </Button>
        </div>

        {score < 0.5 ? (
          <p>Fill at least half of these fields before submitting — thin packets lose.</p>
        ) : null}
      </form>
    </Card>
  );
}
