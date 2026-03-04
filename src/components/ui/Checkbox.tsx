/**
 * Checkbox.
 *
 * Supports the indeterminate state, which the data table's "select all on page" header needs
 * and which a plain `<input type=checkbox>` cannot express declaratively in React without an
 * effect that pokes the DOM node.
 */
import * as RadixCheckbox from '@radix-ui/react-checkbox';

import { cn, pz } from '@lib/cn';

import { color, font, radius, space } from './tokens';

export type CheckedState = boolean | 'indeterminate';

export interface CheckboxProps {
  id: string;
  checked: CheckedState;
  onCheckedChange: (checked: CheckedState) => void;
  /** Visible label. Omit only when `ariaLabel` is provided (table row selectors). */
  label?: string;
  /** Accessible name when there is no visible label. One of the two is required. */
  ariaLabel?: string;
  disabled?: boolean;
  describedBy?: string;
  className?: string;
}

export function Checkbox({
  id,
  checked,
  onCheckedChange,
  label,
  ariaLabel,
  disabled = false,
  describedBy,
  className,
}: CheckboxProps) {
  const box = (
    <RadixCheckbox.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={label ? undefined : ariaLabel}
      aria-describedby={describedBy}
      className={cn(pz('checkbox'), className)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '16px',
        height: '16px',
        background: checked === false ? color.surface : color.brand,
        border: `1px solid ${checked === false ? color.borderStrong : color.brand}`,
        borderRadius: radius.sm,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
      }}
    >
      <RadixCheckbox.Indicator aria-hidden="true" style={{ color: color.textInverse, fontSize: '11px' }}>
        {checked === 'indeterminate' ? '–' : '✓'}
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );

  if (!label) return box;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: space[2] }}>
      {box}
      <label
        htmlFor={id}
        style={{
          fontFamily: font.family,
          fontSize: font.size.md,
          color: disabled ? color.textMuted : color.textPrimary,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {label}
      </label>
    </span>
  );
}

