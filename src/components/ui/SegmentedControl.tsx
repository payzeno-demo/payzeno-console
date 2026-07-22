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
export function SegmentedControl<TValue extends string>({
  segments,
  value,
  onValueChange,
  label,
  size = 'md',
  className,
}: SegmentedControlProps<TValue>) {
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    const enabled = segments.filter((segment) => !segment.disabled);
    const index = enabled.findIndex((segment) => segment.value === value);
    if (index === -1) return;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      const next = enabled[(index + 1) % enabled.length];
      if (next) onValueChange(next.value);
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      const previous = enabled[(index - 1 + enabled.length) % enabled.length];
      if (previous) onValueChange(previous.value);
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(pz('segmented'), className)}
      style={{
        display: 'inline-flex',
        padding: '2px',
        background: color.surfaceSunken,
        borderRadius: radius.md,
      }}
    >
      {segments.map((segment) => {
        const active = segment.value === value;
        return (
          <button
            key={segment.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={segment.disabled}
            tabIndex={active ? 0 : -1}
            onClick={() => onValueChange(segment.value)}
            style={{
              padding: size === 'sm' ? `2px ${space[2]}` : `${space[1]} ${space[3]}`,
              fontFamily: font.family,
              fontSize: size === 'sm' ? font.size.xs : font.size.sm,
              fontWeight: active ? font.weight.semibold : font.weight.regular,
              color: segment.disabled ? color.textMuted : active ? color.textPrimary : color.textSecondary,
              background: active ? color.surface : 'transparent',
              border: 'none',
              borderRadius: radius.sm,
              cursor: segment.disabled ? 'not-allowed' : 'pointer',
            }}
          >
            {segment.label}
          </button>
        );
      })}
    </div>
  );
}
