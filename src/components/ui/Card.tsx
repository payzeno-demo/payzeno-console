/**
 * Card.
 *
 * A surface with a heading. The heading level is a **required** prop rather than a hardcoded
 * `<h3>`: a page whose heading levels skip from h1 to h3 is a documented WCAG failure, and
 * cards get nested in enough places that we cannot guess.
 */
import type { ReactNode } from 'react';

import { cn, pz } from '@lib/cn';

import { color, font, radius, shadow, space } from './tokens';

export type HeadingLevel = 2 | 3 | 4;

/**
 * The element the card renders as. `section` needs an accessible name (`aria-label` or
 * `aria-labelledby`); `article` is for a self-contained tile in a grid of tiles.
 */
export interface CardProps {
  children: ReactNode;
  as?: CardElement;
  /** Accessible name, required when `as="section"` and there is no `title`. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /** Omit for a plain surface with no header region. */
  title?: string;
  /** Required whenever `title` is set. */
  headingLevel?: HeadingLevel;
  description?: string;
  /** Rendered on the right of the header — usually a `<Button>` or a `<SegmentedControl>`. */
  actions?: ReactNode;
  /** Removes the body padding, for cards that hold a full-bleed table. */
  flush?: boolean;
  className?: string;
}

/** Metric tile: a big number with a caption. The reporting summary is four of these. */
export function StatCard({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'neutral' | 'danger';
}) {
  return (
    <div
      className={pz('card', 'stat')}
      style={{
        padding: space[5],
        background: color.surface,
        border: `1px solid ${tone === 'danger' ? color.danger : color.border}`,
        borderRadius: radius.lg,
      }}
    >
      <p style={{ margin: 0, fontSize: font.size.sm, color: color.textSecondary }}>{label}</p>
      <p
        style={{
          margin: `${space[2]} 0 0`,
          fontFamily: font.familyMono,
          fontSize: font.size.xxl,
          fontWeight: font.weight.semibold,
          color: tone === 'danger' ? color.danger : color.textPrimary,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </p>
      {hint ? (
        <p style={{ margin: `${space[1]} 0 0`, fontSize: font.size.sm, color: color.textMuted }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
