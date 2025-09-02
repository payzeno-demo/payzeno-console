/**
 * Badge.
 *
 * A small, non-interactive label. `<StatusPill>` in `components/data/` is the domain-aware
 * wrapper around this — a badge knows about tones, a pill knows about `ChargeStatus`.
 *
 * Colour is never the only signal: every tone gets a distinct border weight and, where the
 * badge conveys state rather than category, callers pass `srPrefix` so the announcement reads
 * "Status: settled" instead of just "settled".
 */
import type { ReactNode } from 'react';

import { cn, pz } from '@lib/cn';
