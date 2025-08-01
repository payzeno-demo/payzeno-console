/**
 * Switch.
 *
 * For settings that take effect immediately (livemode, webhook endpoint enabled/disabled). If
 * the change needs a save button, it is a checkbox, not a switch — that distinction is a
 * usability rule, not a styling one, and tflexbox enforces it in review.
 */
import * as RadixSwitch from '@radix-ui/react-switch';

import { cn, pz } from '@lib/cn';

import { color, duration, font, radius, space } from './tokens';

export interface SwitchProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  /** Hide the label visually but keep it for assistive technology. */
  hideLabel?: boolean;
  description?: string;
  disabled?: boolean;
  /** Rendered while a mutation is in flight — the switch stays in its old position. */
  pending?: boolean;
  className?: string;
}

export function Switch({
  id,
  checked,
  onCheckedChange,
  label,
  hideLabel = false,
  description,
  disabled = false,
  pending = false,
  className,
}: SwitchProps) {
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div
      className={cn(pz('switch'), className)}
      style={{ display: 'flex', alignItems: 'center', gap: space[3] }}
    >
      <RadixSwitch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled || pending}
        aria-label={hideLabel ? label : undefined}
        aria-describedby={descriptionId}
        aria-busy={pending || undefined}
        style={{
          position: 'relative',
          width: '36px',
          height: '20px',
          background: checked ? color.brand : color.borderStrong,
          borderRadius: radius.pill,
          border: 'none',
          cursor: disabled || pending ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: `background ${duration.fast} ease-out`,
          flexShrink: 0,
        }}
      >
        <RadixSwitch.Thumb
          style={{
            display: 'block',
            width: '16px',
            height: '16px',
            background: color.surface,
            borderRadius: radius.pill,
            transform: checked ? 'translateX(18px)' : 'translateX(2px)',
            transition: `transform ${duration.fast} ease-out`,
          }}
        />
      </RadixSwitch.Root>

      {hideLabel ? null : (
        <label htmlFor={id} style={{ fontFamily: font.family, fontSize: font.size.md }}>
          <span style={{ color: disabled ? color.textMuted : color.textPrimary }}>{label}</span>
          {description ? (
            <span
              id={descriptionId}
              style={{ display: 'block', fontSize: font.size.sm, color: color.textMuted }}
            >
              {description}
            </span>
          ) : null}
        </label>
      )}
    </div>
  );
}
