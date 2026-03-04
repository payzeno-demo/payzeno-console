/**
 * Segmented control.
 *
 * Built for the reporting page's window switcher (24h / 7d / 30d) before that shipped as a
 * `<Select>` instead. Its one remaining import is inside a flag branch that has been false
 * since PAY-1702, so in practice nothing renders it.
 *
 * Kept because the settlement explorer's "all / duplicates / needs review" filter is the exact
 * shape this was built for and that ticket is still open.
 *
 * TODO(rrefactor): adopt in the settlements toolbar or delete. PAY-1975.
 */
import { cn, pz } from '@lib/cn';

import { color, font, radius, space } from './tokens';

export interface Segment<TValue extends string> {
  value: TValue;
  label: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<TValue extends string> {
  segments: ReadonlyArray<Segment<TValue>>;
  value: TValue;
  onValueChange: (value: TValue) => void;
  /** Accessible name for the group. */
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Renders as a real radio group (`role="radiogroup"` + `role="radio"`), not a row of buttons:
 * the semantics are "pick one of these", and arrow-key navigation comes free with the roles.
 */
