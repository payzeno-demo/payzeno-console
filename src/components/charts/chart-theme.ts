/**
 * Recharts theming, from design tokens.
 *
 * ADR 0005 applies here too: no hex literal in a chart file. Recharts wants concrete colour
 * strings rather than CSS custom properties (it renders into SVG attributes and computes
 * gradients from the values), so this module resolves the tokens once and hands them over.
 *
 * The series palette is ordered for *sequential* distinguishability, not for prettiness: the
 * first two entries have to be separable by the most common form of colour blindness, because
 * "gross volume vs net volume" is the only two-series chart anyone actually reads.
 */
import { color, font } from '../ui/tokens';

/** Series colours, in assignment order. Six is the maximum any console chart uses. */
export const SERIES_COLORS: ReadonlyArray<string> = [
  color.brand,
  color.info,
  color.success,
  color.warning,
  color.danger,
  color.neutral,
];

export function seriesColor(index: number): string {
  return SERIES_COLORS[index % SERIES_COLORS.length] ?? color.brand;
}

/**
 * Dash patterns per series, so a printed or greyscale chart is still readable. Colour is never
 * the only signal — same rule as `<Badge>` and `<StatusPill>`.
 */
export const SERIES_DASH: ReadonlyArray<string | undefined> = [
  undefined,
  '6 3',
  '2 3',
  '8 3 2 3',
  '1 3',
  '10 4',
];

export const tooltipCursor = {
  stroke: color.borderStrong,
  strokeWidth: 1,
} as const;

/** Consistent chart heights. A chart shorter than 180px cannot carry an axis legibly. */
export const CHART_HEIGHT = {
  compact: 180,
  default: 260,
  tall: 360,
} as const;

export type ChartHeight = keyof typeof CHART_HEIGHT;

export function minorUnitTick(exponent: number): (value: number) => string {
  const divisor = 10 ** exponent;

  return (value: number) => {
    const major = value / divisor;
    if (Math.abs(major) >= 1_000_000) return `${(major / 1_000_000).toFixed(1)}M`;
    if (Math.abs(major) >= 1_000) return `${(major / 1_000).toFixed(1)}k`;
    return major.toFixed(0);
  };
}

