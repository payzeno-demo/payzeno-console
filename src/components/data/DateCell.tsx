/**
 * Date / timestamp cell.
 *
 * Renders a `<time>` element with a machine-readable `dateTime`, a smart human label
 * ("3 hours ago" recently, an absolute date after a week) and the full timestamp in a tooltip.
 * The tooltip repeats information rather than carrying it — the absolute value is also the
 * `dateTime` attribute, which is what assistive technology and copy-paste both use.
 *
 * `IsoDate` (banking days) goes through `mode="banking"`, which never touches a timezone.
 */
import type { IsoDate, IsoTimestamp } from '@payzeno/contracts';

import { pz } from '@lib/cn';
import { formatBankingDate, formatPreciseTimestamp, formatSmart, toDateTimeAttr } from '@lib/date';

import { Tooltip } from '../ui/Tooltip';
import { color, font } from '../ui/tokens';

export interface DateCellProps {
  value: IsoTimestamp | IsoDate | null | undefined;
  /** `instant` for RFC 3339 timestamps, `banking` for calendar days. */
  mode?: 'instant' | 'banking';
  /** Skip the relative form and always show the absolute date. */
  absolute?: boolean;
}

export function DateCell({ value, mode = 'instant', absolute = false }: DateCellProps) {
  if (!value) {
    return <span style={{ color: color.textMuted }}>—</span>;
  }

  if (mode === 'banking') {
    return (
      <time
        dateTime={value}
        className={pz('date-cell')}
        style={{ fontFamily: font.family, whiteSpace: 'nowrap' }}
      >
        {formatBankingDate(value)}
