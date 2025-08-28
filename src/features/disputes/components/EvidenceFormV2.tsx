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

const MULTILINE: ReadonlySet<EvidenceField> = new Set([
  'product_description',
  'uncategorized_text',
]);

export function completeness(
  evidence: DisputeEvidence,
  fields: ReadonlyArray<EvidenceField>,
): number {
  if (fields.length === 0) return 1;
  const filled = fields.filter((field) => (evidence[field] ?? '').toString().trim().length > 0);
  return filled.length / fields.length;
}

