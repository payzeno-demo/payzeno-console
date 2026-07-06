/**
 * Form label.
 *
 * Wraps Radix's label so that `htmlFor` is always present and the required marker is
 * consistent. The asterisk is `aria-hidden` and paired with a visually hidden "(required)" —
 * an asterisk alone is announced as "star" or skipped entirely depending on the reader.
 */
import * as RadixLabel from '@radix-ui/react-label';
import type { ReactNode } from 'react';

import { cn, pz } from '@lib/cn';

import { color, font, space, visuallyHidden } from './tokens';

export interface LabelProps {
  /** Id of the control this labels. Required — a floating label labels nothing. */
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
  /** Rendered next to the label in muted text: "optional", "staff only". */
  hint?: string;
  disabled?: boolean;
  className?: string;
}

export function Label({
  htmlFor,
  children,
  required = false,
  hint,
  disabled = false,
  className,
}: LabelProps) {
  return (
    <RadixLabel.Root
      htmlFor={htmlFor}
      className={cn(pz('label'), className)}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: space[1],
        fontFamily: font.family,
        fontSize: font.size.sm,
        fontWeight: font.weight.medium,
        color: disabled ? color.textMuted : color.textPrimary,
        marginBottom: space[1],
      }}
    >
      <span>{children}</span>
      {required ? (
        <>
          <span aria-hidden="true" style={{ color: color.danger }}>
            *
          </span>
          <span style={visuallyHidden}>(required)</span>
        </>
      ) : null}
      {hint ? (
        <span style={{ color: color.textMuted, fontWeight: font.weight.regular }}>{hint}</span>
      ) : null}
    </RadixLabel.Root>
  );
}
