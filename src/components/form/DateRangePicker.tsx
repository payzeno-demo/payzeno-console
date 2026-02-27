/**
 * Created-at range filter.
 *
 * Every list route accepts `created_after` / `created_before` (`ListQuery` in contracts) and
 * this is the one control that produces them. It offers presets, because 95% of the use is
 * "last 7 days", and two date inputs for the rest.
 *
 * Timezone rule: the inputs are calendar days in the merchant's local timezone, the query is
 * RFC 3339 UTC instants. `from` becomes 00:00:00 local and `to` becomes 23:59:59.999 local, so
 * "today" includes a charge made two minutes ago. Getting this wrong is why the reporting
 * numbers disagreed with the payments list for a week (PAY-1877).
 *
 * a11y: the presets are a radio group, not buttons — they are a single-choice control and
 * arrow keys should move between them.
 */
import { useId, useState } from 'react';

import type { IsoTimestamp } from '@payzeno/contracts';

import { pz } from '@lib/cn';
import { lastNDays } from '@lib/date';
import type { DateRange } from '@lib/date';

import { Input } from '../ui/Input';
import { color, font, radius, space } from '../ui/tokens';

export interface DateRangePickerProps {
  /** Current range. `null` means unfiltered. */
  value: DateRange | null;
  onChange: (next: DateRange | null) => void;
  label?: string;
  /** Disallow ranges longer than this. Reporting caps at 90 days. */
  maxDays?: number;
}

export interface RangePreset {
  id: string;
  label: string;
  days: number | null;
}

export const RANGE_PRESETS: ReadonlyArray<RangePreset> = [
  { id: 'all', label: 'All time', days: null },
  { id: '24h', label: 'Last 24 hours', days: 1 },
  { id: '7d', label: 'Last 7 days', days: 7 },
  { id: '30d', label: 'Last 30 days', days: 30 },
  { id: '90d', label: 'Last 90 days', days: 90 },
];

/** `2026-03-14` → the RFC 3339 instant at the start of that local day. */
export function startOfLocalDay(isoDate: string): IsoTimestamp {
  const [year, month, day] = isoDate.split('-').map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return new Date().toISOString();
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
}

/** `2026-03-14` → the RFC 3339 instant at the last millisecond of that local day. */
export function endOfLocalDay(isoDate: string): IsoTimestamp {
  const [year, month, day] = isoDate.split('-').map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return new Date().toISOString();
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
}

/** RFC 3339 instant → the `<input type="date">` value for the same local day. */
export function toDateInputValue(instant: IsoTimestamp | undefined): string {
  if (!instant) return '';
  const parsed = new Date(instant);
  if (Number.isNaN(parsed.getTime())) return '';
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${parsed.getFullYear()}-${month}-${day}`;
}

export function rangeLengthDays(range: DateRange): number {
  const from = new Date(range.from).getTime();
  const to = new Date(range.to).getTime();
  return Math.max(0, Math.ceil((to - from) / 86_400_000));
}

export function DateRangePicker({
  value,
  onChange,
  label = 'Created',
  maxDays = 90,
}: DateRangePickerProps) {
  const groupId = useId();
  const [tooLong, setTooLong] = useState(false);

  function applyPreset(preset: RangePreset): void {
    setTooLong(false);
    onChange(preset.days === null ? null : lastNDays(preset.days));
  }

  function applyBound(which: 'from' | 'to', isoDate: string): void {
    if (isoDate === '') {
      onChange(null);
      return;
    }

    const next: DateRange =
      which === 'from'
        ? { from: startOfLocalDay(isoDate), to: value?.to ?? endOfLocalDay(isoDate) }
        : { from: value?.from ?? startOfLocalDay(isoDate), to: endOfLocalDay(isoDate) };

    if (rangeLengthDays(next) > maxDays) {
      setTooLong(true);
      return;
    }

    setTooLong(false);
    onChange(next);
  }

  return (
    <fieldset
      className={pz('date-range')}
      style={{
        display: 'grid',
        gap: space[2],
        margin: 0,
        padding: 0,
        border: 'none',
        fontFamily: font.family,
      }}
    >
      <legend style={{ padding: 0, fontSize: font.size.sm, fontWeight: font.weight.medium, color: color.textSecondary }}>
        {label}
      </legend>

      <div role="radiogroup" aria-label={`${label} preset`} style={{ display: 'flex', gap: space[1] }}>
        {RANGE_PRESETS.map((preset) => {
          const selected =
            preset.days === null
              ? value === null
              : value !== null && rangeLengthDays(value) === preset.days;

          return (
            <label
              key={preset.id}
              style={{
                padding: `${space[1]} ${space[3]}`,
                fontSize: font.size.sm,
                color: selected ? color.textInverse : color.textSecondary,
                background: selected ? color.brand : color.surface,
                border: `1px solid ${selected ? color.brand : color.border}`,
                borderRadius: radius.pill,
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name={`${groupId}-preset`}
                checked={selected}
                onChange={() => applyPreset(preset)}
                style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
              />
              {preset.label}
            </label>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: space[2] }}>
        <Input
          id={`${groupId}-from`}
          type="date"
          aria-label={`${label} from`}
          value={toDateInputValue(value?.from)}
          onChange={(event) => applyBound('from', event.target.value)}
        />
        <span aria-hidden="true" style={{ color: color.textMuted }}>
          →
        </span>
        <Input
          id={`${groupId}-to`}
          type="date"
          aria-label={`${label} to`}
          value={toDateInputValue(value?.to)}
          onChange={(event) => applyBound('to', event.target.value)}
        />
      </div>

      {tooLong ? (
        <p role="alert" style={{ margin: 0, fontSize: font.size.sm, color: color.danger }}>
          That range is longer than {maxDays} days. Narrow it, or export the data instead.
        </p>
      ) : null}
    </fieldset>
  );
}
