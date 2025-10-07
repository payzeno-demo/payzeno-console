/**
 * Shared tooltip surface for the two chart wrappers.
 *
 * Recharts' default tooltip renders raw numbers, which for this product means minor units —
 * "428500" where the user expects "£4,285.00". Every chart in the console passes money, so the
 * formatting is not optional and it belongs in one place.
 *
 * a11y: a hover tooltip is not reachable by keyboard, so it is never the only way to read a
 * value. `<LineChart>` and `<BarChart>` both render a `<table>` of the same data, visually
 * hidden, immediately after the SVG. That table is the accessible chart.
 */
import type { CurrencyCode, Money } from '@payzeno/contracts';

import { formatMoney, money } from '@lib/money';

import { color, font, radius, shadow, space } from '../ui/tokens';

export interface TooltipEntry {
  name: string;
  value: number;
  color?: string;
  /** When set the value is treated as minor units of this currency. */
  currency?: CurrencyCode;
}

export interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: ReadonlyArray<TooltipEntry>;
  /** Currency for every series that does not declare its own. */
  currency?: CurrencyCode;
  /** Formats the x-axis label — usually a bucket timestamp. */
  formatLabel?: (label: string) => string;
}

export function formatEntryValue(entry: TooltipEntry, fallback?: CurrencyCode): string {
  const currency = entry.currency ?? fallback;
  if (!currency) return entry.value.toLocaleString();

  const value: Money = money(Math.round(entry.value), currency);
  return formatMoney(value);
}

export function ChartTooltip({
  active,
  label,
  payload,
  currency,
  formatLabel,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      role="presentation"
      style={{
        minWidth: '160px',
        padding: space[3],
        fontFamily: font.family,
        fontSize: font.size.sm,
        color: color.textPrimary,
        background: color.surface,
        border: `1px solid ${color.border}`,
        borderRadius: radius.md,
        boxShadow: shadow.md,
      }}
    >
      {label ? (
        <p style={{ margin: `0 0 ${space[2]}`, fontWeight: font.weight.semibold }}>
          {formatLabel ? formatLabel(label) : label}
        </p>
      ) : null}

      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: `${space[1]} ${space[3]}`, margin: 0 }}>
        {payload.map((entry) => (
          <div key={entry.name} style={{ display: 'contents' }}>
            <dt style={{ display: 'flex', alignItems: 'center', gap: space[2], color: color.textSecondary }}>
              <span
                aria-hidden="true"
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: radius.pill,
                  background: entry.color ?? color.neutral,
                }}
              />
              {entry.name}
            </dt>
            <dd style={{ margin: 0, textAlign: 'right', fontFamily: font.familyMono }}>
              {formatEntryValue(entry, currency)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
