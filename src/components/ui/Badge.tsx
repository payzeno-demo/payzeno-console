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

import { font, radius, space, toneStyle, visuallyHidden } from './tokens';
import type { Tone } from './tokens';

export type BadgeSize = 'sm' | 'md';

/**
 * `critical` is an alias for `danger`, kept because the notification code models severity as
 * `critical | warning | info` (`features/notifications/notification.types.ts`) and translating
 * at every call site was worse than accepting both here.
 */
export type BadgeTone = Tone | 'critical';

function resolveTone(tone: BadgeTone): Tone {
  return tone === 'critical' ? 'danger' : tone;
}

export interface BadgeProps {
  children: ReactNode;
