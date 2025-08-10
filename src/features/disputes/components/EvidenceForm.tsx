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
