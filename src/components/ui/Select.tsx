/**
 * Select.
 *
 * Radix's select rather than a native `<select>`, because every filter in the console needs an
 * option list with a secondary line (status + description) and a native select cannot do it.
 * The trade is that we own the keyboard contract — Radix handles it, but only if we do not
 * fight it, so this wrapper stays thin.
 *
 * `options` is data, not children: it keeps `<FilterBar>` able to build a select from a
 * contracts enum tuple with one `.map`.
 */
import * as RadixSelect from '@radix-ui/react-select';

import { cn, pz } from '@lib/cn';

import { color, font, radius, shadow, space, zIndex } from './tokens';

export interface SelectOption<TValue extends string> {
  value: TValue;
  label: string;
  /** Secondary line, e.g. what a settlement status actually means. */
  description?: string;
  disabled?: boolean;
}

export interface SelectProps<TValue extends string> {
  id: string;
  value: TValue | null;
  onValueChange: (value: TValue) => void;
  options: ReadonlyArray<SelectOption<TValue>>;
  placeholder?: string;
  /** Accessible name when there is no visible `<Label>` (toolbar selects). */
  ariaLabel?: string;
  /**
   * Renders a visible `<label>` above the trigger and uses it as the accessible name. Prefer
   * this over `ariaLabel` anywhere the control is not obviously self-describing.
   */
  label?: string;
  disabled?: boolean;
  invalid?: boolean;
  errorId?: string;
  className?: string;
}

/**
 * Radix reserves `''` (it means "no selection, show the placeholder") and throws if an Item
 * uses it. Every filter's "All statuses" option is `''`, so the wrapper swaps it for a
 * sentinel on the way in and back on the way out; callers keep using `''`.
 */
const EMPTY_VALUE = '__pz_all__';
const toRadix = (value: string): string => (value === '' ? EMPTY_VALUE : value);
const fromRadix = (value: string): string => (value === EMPTY_VALUE ? '' : value);

export function Select<TValue extends string>({
  id,
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  ariaLabel,
  label,
  disabled = false,
  invalid = false,
  errorId,
  className,
}: SelectProps<TValue>) {
  const control = (
    <RadixSelect.Root
      value={value === null ? undefined : toRadix(value)}
      onValueChange={(next) => onValueChange(fromRadix(next) as TValue)}
      disabled={disabled}
    >
      <RadixSelect.Trigger
        id={id}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
        className={cn(pz('select', 'trigger'), className)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: space[2],
          minWidth: '160px',
          height: '36px',
          padding: `0 ${space[3]}`,
          fontFamily: font.family,
          fontSize: font.size.md,
          color: value ? color.textPrimary : color.textMuted,
          background: disabled ? color.surfaceMuted : color.surface,
          border: `1px solid ${invalid ? color.danger : color.borderStrong}`,
          borderRadius: radius.md,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon aria-hidden="true">▾</RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          className={pz('select', 'content')}
          style={{
            minWidth: '220px',
            padding: space[1],
            background: color.surface,
            border: `1px solid ${color.border}`,
            borderRadius: radius.md,
            boxShadow: shadow.md,
            zIndex: zIndex.popover,
          }}
        >
          <RadixSelect.Viewport>
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={toRadix(option.value)}
                disabled={option.disabled}
                className={pz('select', 'item')}
                style={{
                  display: 'block',
                  padding: `${space[2]} ${space[3]}`,
                  fontSize: font.size.md,
                  color: option.disabled ? color.textMuted : color.textPrimary,
                  borderRadius: radius.sm,
                  cursor: option.disabled ? 'not-allowed' : 'pointer',
                }}
              >
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                {option.description ? (
                  <span
                    style={{
                      display: 'block',
                      fontSize: font.size.xs,
                      color: color.textMuted,
                    }}
                  >
                    {option.description}
                  </span>
                ) : null}
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );

  if (!label) return control;

  // A visible label wins over `ariaLabel`: two accessible names on one control is a conflict
  // and the browser's resolution order is not the one a reviewer expects.
  return (
    <span className={pz('select')} style={{ display: 'grid', gap: space[1] }}>
      <label
        htmlFor={id}
        style={{
          fontSize: font.size.sm,
          fontWeight: font.weight.medium,
          color: color.textSecondary,
        }}
      >
        {label}
      </label>
      {control}
    </span>
  );
}

/** Build options from a contracts enum tuple, with a labeller. */
export function optionsFrom<TValue extends string>(
  values: ReadonlyArray<TValue>,
  label: (value: TValue) => string,
): SelectOption<TValue>[] {
  return values.map((value) => ({ value, label: label(value) }));
}
