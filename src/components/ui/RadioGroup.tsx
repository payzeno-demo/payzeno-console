/**
 * Radio group.
 *
 * Used where the options are few and mutually exclusive and the user benefits from seeing all
 * of them: refund reason, payout method, dispute evidence submission mode. A select would hide
 * choices that change what the API does.
 *
 * The group renders as a `<fieldset>` with a `<legend>`; that pairing is what makes a screen
 * reader announce "Refund reason, radio group, 1 of 4".
 */
import * as RadixRadioGroup from '@radix-ui/react-radio-group';

import { cn, pz } from '@lib/cn';

import { color, font, radius, space } from './tokens';

export interface RadioOption<TValue extends string> {
  value: TValue;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps<TValue extends string> {
  name: string;
  legend: string;
  value: TValue | null;
  onValueChange: (value: TValue) => void;
  options: ReadonlyArray<RadioOption<TValue>>;
  /** Lay options out in a row. Only sensible for two or three short labels. */
  inline?: boolean;
  disabled?: boolean;
  className?: string;
}

export function RadioGroup<TValue extends string>({
  name,
  legend,
  value,
  onValueChange,
  options,
  inline = false,
  disabled = false,
  className,
}: RadioGroupProps<TValue>) {
  return (
    <fieldset
      className={cn(pz('radio-group'), className)}
      style={{ border: 'none', margin: 0, padding: 0 }}
    >
      <legend
        style={{
          padding: 0,
          marginBottom: space[2],
          fontFamily: font.family,
          fontSize: font.size.sm,
          fontWeight: font.weight.medium,
          color: color.textPrimary,
        }}
      >
        {legend}
      </legend>

      <RadixRadioGroup.Root
        name={name}
        value={value ?? undefined}
        onValueChange={(next) => onValueChange(next as TValue)}
        disabled={disabled}
        style={{
          display: 'flex',
          flexDirection: inline ? 'row' : 'column',
          gap: inline ? space[4] : space[2],
        }}
      >
        {options.map((option) => {
          const itemId = `${name}-${option.value}`;
          return (
            <div key={option.value} style={{ display: 'flex', alignItems: 'flex-start', gap: space[2] }}>
              <RadixRadioGroup.Item
                id={itemId}
                value={option.value}
                disabled={option.disabled || disabled}
                className={pz('radio-group', 'item')}
                style={{
                  width: '16px',
                  height: '16px',
                  marginTop: '2px',
                  background: color.surface,
                  border: `1px solid ${value === option.value ? color.brand : color.borderStrong}`,
                  borderRadius: radius.pill,
                  cursor: option.disabled ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                }}
              >
                <RadixRadioGroup.Indicator
                  aria-hidden="true"
                  style={{
                    display: 'block',
                    width: '8px',
                    height: '8px',
                    margin: '3px',
                    background: color.brand,
                    borderRadius: radius.pill,
                  }}
                />
              </RadixRadioGroup.Item>

              <label htmlFor={itemId} style={{ fontFamily: font.family, fontSize: font.size.md }}>
                <span style={{ color: option.disabled ? color.textMuted : color.textPrimary }}>
                  {option.label}
                </span>
                {option.description ? (
                  <span style={{ display: 'block', fontSize: font.size.sm, color: color.textMuted }}>
                    {option.description}
                  </span>
                ) : null}
              </label>
            </div>
          );
        })}
      </RadixRadioGroup.Root>
    </fieldset>
  );
}
