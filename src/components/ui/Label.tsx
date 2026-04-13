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

