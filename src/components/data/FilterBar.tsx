/**
 * The row of filter controls above a table.
 *
 * It is a `role="search"` region with a real accessible name, so a keyboard user can jump
 * straight to the filters, and it owns the "N filters active / Clear all" affordance — every
 * feature had its own slightly different version of that before this component existed
 * (PAY-1802).
 *
 * Filters live in URL state (`hooks/useQueryParamState.ts`), not in this component. FilterBar
 * is presentation; it does not know what a charge status is.
 */
import type { ReactNode } from 'react';

import { pz } from '@lib/cn';
import { pluralise } from '@lib/format';

import { Button } from '../ui/Button';
import { color, font, radius, space } from '../ui/tokens';

export interface FilterBarProps {
  /** Accessible name for the region — "Charge filters". Required. */
  label: string;
  children: ReactNode;
  /**
   * Number of filters currently narrowing the list. Renders the count and the clear button.
   * Compute it with `types/filters.ts::activeFilterCount`.
   */
  activeCount?: number;
  /** Reset every filter. Omit to hide the clear button entirely. */
  onClear?: () => void;
  /** Right-hand slot — a saved-view picker, a date range, an export button. */
  trailing?: ReactNode;
  className?: string;
}

export function FilterBar({
  label,
  children,
  activeCount = 0,
  onClear,
  trailing,
  className,
}: FilterBarProps) {
  const hasActive = activeCount > 0;

  return (
    <section
      role="search"
      aria-label={label}
      className={pz('filter-bar') + (className ? ` ${className}` : '')}
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        gap: space[3],
        padding: `${space[3]} ${space[4]}`,
        marginBottom: space[4],
        background: color.surfaceMuted,
        border: `1px solid ${color.border}`,
        borderRadius: radius.lg,
        fontFamily: font.family,
      }}
