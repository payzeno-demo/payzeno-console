/**
 * Time-series line chart — volume over time, balance history.
 *
 * A thin wrapper over recharts. Deliberately thin: the reporting feature owns what to plot,
 * this owns how a Payzeno chart looks and how it behaves for someone who cannot see it.
 *
 * a11y: the SVG is `aria-hidden` and an equivalent `<table>` follows it, visually hidden. That
 * is the only honest way to expose a chart — `aria-label="a line chart"` tells a screen-reader
 * user that data exists and then withholds it.
 */
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { CurrencyCode } from '@payzeno/contracts';

import { formatTimestamp } from '@lib/date';
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
  seriesDash,
  tooltipCursor,
} from './chart-theme';
import type { ChartHeight } from './chart-theme';

export interface LineSeries {
  /** Key into each datum. */
  dataKey: string;
  /** Legend and tooltip name. */
  name: string;
}

export interface LineChartProps<TDatum extends Record<string, unknown>> {
  data: ReadonlyArray<TDatum>;
  series: ReadonlyArray<LineSeries>;
  /** Key holding the x value. RFC 3339 timestamps are formatted for display. */
  xKey: string;
  /** Accessible name for the chart region and the caption of the data table. */
  title: string;
  /** Values are minor units of this currency. Drives the axis and the tooltip. */
  currency?: CurrencyCode;
  height?: ChartHeight;
}

export function LineChart<TDatum extends Record<string, unknown>>({
  data,
  series,
  xKey,
  title,
  currency,
  height = 'default',
}: LineChartProps<TDatum>) {
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
          <RechartsLineChart data={data as TDatum[]} margin={CHART_MARGIN}>
            <CartesianGrid {...gridStyle} vertical={false} />
            <XAxis
              dataKey={xKey}
              tick={axisStyle}
              tickLine={false}
              axisLine={{ stroke: color.border }}
              tickFormatter={(value: string) => formatTimestamp(value)}
            />
            <YAxis
              tick={axisStyle}
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={currency ? minorUnitTick(exponent) : undefined}
            />
            <Tooltip
              cursor={tooltipCursor}
              content={<ChartTooltip currency={currency} formatLabel={(label) => formatTimestamp(label)} />}
            />
            {series.map((line, index) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                name={line.name}
                stroke={seriesColor(index)}
                strokeDasharray={seriesDash(index)}
                strokeWidth={2}
                dot={false}
                // The animation makes the reporting page feel slow on a 90-day window.
                isAnimationActive={data.length < 120}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>

      {/* The accessible chart. */}
      <table style={visuallyHidden as React.CSSProperties}>
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Time</th>
            {series.map((line) => (
              <th key={line.dataKey} scope="col">
                {line.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((datum, index) => (
            <tr key={`${String(datum[xKey])}-${index}`}>
              <th scope="row">{formatTimestamp(String(datum[xKey]))}</th>
              {series.map((line) => (
                <td key={line.dataKey}>{String(datum[line.dataKey] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
