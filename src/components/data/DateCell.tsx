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
