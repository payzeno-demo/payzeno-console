/**
 * Categorical bar chart — settled vs failed items per day, disputes by reason.
 *
 * Same contract as `<LineChart>`: recharts for the picture, a visually hidden `<table>` for
 * anyone who cannot see it, tokens for every colour.
 *
 * Stacking is opt-in and, when it is on, the series order is the *stack* order (first series
 * at the bottom). Recharts does not warn when a stacked series has a negative value mixed in
 * with positives, and the result is a bar that visually lies — `assertStackable` catches it in
 * development instead.
 */
import {
  Bar,
  CartesianGrid,
  Legend,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { CurrencyCode } from '@payzeno/contracts';

import { warnUnless } from '@lib/assert';
import { CURRENCY_EXPONENT } from '@lib/money';

import { color, font, space, visuallyHidden } from '../ui/tokens';

import { ChartTooltip } from './ChartTooltip';
import {
  CHART_HEIGHT,
  CHART_MARGIN,
  EMPTY_CHART_MESSAGE,
  axisStyle,
  gridStyle,
  minorUnitTick,
  seriesColor,
} from './chart-theme';
import type { ChartHeight } from './chart-theme';

export interface BarSeries {
  dataKey: string;
  name: string;
  /** Override the palette assignment — status charts want the status tone. */
  color?: string;
}

export interface BarChartProps<TDatum extends Record<string, unknown>> {
  data: ReadonlyArray<TDatum>;
  series: ReadonlyArray<BarSeries>;
  xKey: string;
  title: string;
  currency?: CurrencyCode;
  height?: ChartHeight;
  stacked?: boolean;
  /** Show the legend. Off for single-series charts, where it is noise. */
  legend?: boolean;
}

/**
 * Stacked bars with mixed signs render as overlapping segments rather than as a net value.
 * Warn rather than throw: a chart is not worth crashing a page over.
 */
export function assertStackable<TDatum extends Record<string, unknown>>(
  data: ReadonlyArray<TDatum>,
  series: ReadonlyArray<BarSeries>,
): void {
  const values = data.flatMap((datum) =>
    series.map((entry) => Number(datum[entry.dataKey] ?? 0)),
  );
  const hasNegative = values.some((value) => value < 0);
  const hasPositive = values.some((value) => value > 0);

  warnUnless(
    !(hasNegative && hasPositive),
    'stacked BarChart received both positive and negative values; the bars will not read as a net total',
  );
}

export function BarChart<TDatum extends Record<string, unknown>>({
  data,
  series,
  xKey,
  title,
  currency,
  height = 'default',
  stacked = false,
  legend = false,
}: BarChartProps<TDatum>) {
  if (stacked) assertStackable(data, series);

  const exponent = currency ? CURRENCY_EXPONENT[currency] : 0;

  if (data.length === 0) {
    return (
      <p
        role="status"
        style={{
          margin: 0,
          padding: space[8],
          textAlign: 'center',
          fontFamily: font.family,
          fontSize: font.size.md,
          color: color.textMuted,
        }}
      >
        {EMPTY_CHART_MESSAGE}
      </p>
    );
  }

  return (
    <figure style={{ margin: 0 }}>
      <div aria-hidden="true" style={{ width: '100%', height: CHART_HEIGHT[height] }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data as TDatum[]} margin={CHART_MARGIN}>
            <CartesianGrid {...gridStyle} vertical={false} />
            <XAxis dataKey={xKey} tick={axisStyle} tickLine={false} axisLine={{ stroke: color.border }} />
            <YAxis
              tick={axisStyle}
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={currency ? minorUnitTick(exponent) : undefined}
            />
            <Tooltip cursor={{ fill: color.surfaceSunken }} content={<ChartTooltip currency={currency} />} />
            {legend ? <Legend wrapperStyle={{ fontFamily: font.family, fontSize: 12 }} /> : null}

            {series.map((entry, index) => (
              <Bar
                key={entry.dataKey}
                dataKey={entry.dataKey}
                name={entry.name}
                fill={entry.color ?? seriesColor(index)}
                stackId={stacked ? 'stack' : undefined}
                radius={stacked ? undefined : [3, 3, 0, 0]}
                isAnimationActive={data.length < 60}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>

      <table style={visuallyHidden as React.CSSProperties}>
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Bucket</th>
            {series.map((entry) => (
              <th key={entry.dataKey} scope="col">
                {entry.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((datum, index) => (
            <tr key={`${String(datum[xKey])}-${index}`}>
              <th scope="row">{String(datum[xKey])}</th>
              {series.map((entry) => (
                <td key={entry.dataKey}>{String(datum[entry.dataKey] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
