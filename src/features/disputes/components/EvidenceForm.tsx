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
