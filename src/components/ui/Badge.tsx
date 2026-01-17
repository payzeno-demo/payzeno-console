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
  tone?: BadgeTone;
  size?: BadgeSize;
  /** Outline instead of a filled background. Used inside already-tinted rows. */
  subtle?: boolean;
  /** Screen-reader-only prefix, e.g. "Status". */
  srPrefix?: string;
  /** Small leading dot. Decorative. */
  withDot?: boolean;
  className?: string;
}

export function Badge({
  children,
  tone = 'neutral',
  size = 'md',
  subtle = false,
  srPrefix,
  withDot = false,
  className,
}: BadgeProps) {
  const resolved = resolveTone(tone);
  const palette = toneStyle(resolved);

  return (
    <span
      className={cn(pz('badge'), pz('badge', undefined, resolved), className)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: space[1],
        padding: size === 'sm' ? `1px ${space[2]}` : `2px ${space[2]}`,
        fontFamily: font.family,
        fontSize: size === 'sm' ? font.size.xs : font.size.sm,
        fontWeight: font.weight.medium,
        lineHeight: font.lineHeight.tight,
        color: palette.fg,
        background: subtle ? 'transparent' : palette.bg,
        border: `1px solid ${subtle ? palette.border : 'transparent'}`,
        borderRadius: radius.pill,
        whiteSpace: 'nowrap',
      }}
    >
      {srPrefix ? <span style={visuallyHidden}>{srPrefix}: </span> : null}
      {withDot ? (
        <span
          aria-hidden="true"
          style={{
            width: '6px',
            height: '6px',
            borderRadius: radius.pill,
            background: palette.fg,
          }}
        />
      ) : null}
      {children}
    </span>
  );
}

/** Numeric badge for nav items ("3 disputes need a response"). Caps at 99+. */
export function CountBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;

