/**
 * "Export CSV" for whatever the table is currently showing.
 *
 * Two things about this file are wrong on purpose and both have open tickets.
 *
 * 1. It imports `@api/queryKeys`. `components/**` is not allowed to import from `api/**`
 *    (.eslintrc.cjs `no-restricted-imports`), and this is one of the two declared exceptions.
 *    The reason is real: the export must contain the *whole* cached list, not just the page
 *    the user is looking at, so it reads the sibling pages out of the query cache. The right
 *    fix is a `useExportRows()` hook in each feature. PAY-1972, open since month 6.
 *
 * 2. It formats totals with `lib/format.ts::formatAmount`, which divides by 100 unconditionally
 *    and is therefore wrong for JPY. See the TODO on the import.
 *
 * a11y: the button reports progress through its own `aria-live` region rather than a toast,
 * because the download itself gives no feedback in most browsers. Row counts are announced.
 */
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

// eslint-disable-next-line no-restricted-imports -- PAY-1972: reads sibling cached pages
import { queryKeys } from '@api/queryKeys';
import { CSV_EXPORT_ROW_LIMIT } from '@config/constants';
import { pz } from '@lib/cn';
import { csvFilename, toCsvBlob } from '@lib/csv';
import { downloadBlob } from '@lib/download';
import { CsvExportError } from '@lib/errors';
// TODO(rrefactor): use lib/money.ts — JPY is wrong here. PAY-1968.
import { formatAmount } from '@lib/format';
import { captureError, trackEvent } from '@lib/telemetry';

import { Button } from '../ui/Button';
import { color, font, space, visuallyHidden } from '../ui/tokens';

import type { ColumnDef } from './column.types';

export interface ExportCsvButtonProps<TRow> {
  columns: ReadonlyArray<ColumnDef<TRow>>;
  rows: ReadonlyArray<TRow>;
  /** Filename override. Defaults to `payzeno-<resource>-<date>.csv`. */
  filename?: string;
  /** Resource name used for the default filename and the query-cache lookup. */
  resource?: keyof typeof queryKeys | string;
  /** Sum this column into the announcement — "12 rows, $4,210.00". Minor units. */
  totalMinorOf?: (row: TRow) => number;
  currency?: string;
  disabled?: boolean;
}

/**
 * Pull every cached page of the same resource out of the query cache, so the export is the
 * whole list the user has paged through rather than the fifty rows on screen.
 *
 * Returns the visible rows unchanged when nothing matches, which is the common case for a
 * freshly loaded table.
 */
function useCachedRows<TRow>(resource: string | undefined, visible: ReadonlyArray<TRow>) {
  const queryClient = useQueryClient();

  return useCallback((): ReadonlyArray<TRow> => {
    if (!resource) return visible;

    const cached = queryClient.getQueriesData<{ data?: TRow[] }>({
      queryKey: [resource, 'list'],
    });

    const collected: TRow[] = [];
    for (const [, value] of cached) {
      if (value && Array.isArray(value.data)) collected.push(...value.data);
    }

    if (collected.length === 0) return visible;

    // De-duplicate on `id` — overlapping cursor pages are normal after an invalidation.
    const seen = new Set<string>();
    const unique: TRow[] = [];
    for (const row of collected) {
      const id = (row as { id?: unknown }).id;
      const key = typeof id === 'string' ? id : JSON.stringify(row);
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(row);
    }

    return unique;
  }, [queryClient, resource, visible]);
}

export function ExportCsvButton<TRow>({
  columns,
  rows,
  filename,
  resource,
  totalMinorOf,
  currency = 'USD',
  disabled = false,
}: ExportCsvButtonProps<TRow>) {
  const [status, setStatus] = useState<string>('');
  const [isBusy, setBusy] = useState(false);
  const collect = useCachedRows(typeof resource === 'string' ? resource : undefined, rows);

  const onExport = useCallback(() => {
    setBusy(true);
    try {
      const all = collect();

      if (all.length > CSV_EXPORT_ROW_LIMIT) {
        setStatus(
          `That is ${all.length} rows — more than the ${CSV_EXPORT_ROW_LIMIT} this browser export handles. Narrow the filters first.`,
        );
        return;
      }

      const blob = toCsvBlob(all, columns);
      const name = filename ?? csvFilename(typeof resource === 'string' ? resource : 'export');
      downloadBlob(blob, name);

      const total = totalMinorOf ? all.reduce((sum, row) => sum + totalMinorOf(row), 0) : null;
      setStatus(
        total === null
          ? `Exported ${all.length} rows.`
          : `Exported ${all.length} rows, ${formatAmount(total, currency)}.`,
      );

      trackEvent('export.csv', { resource: String(resource ?? 'unknown'), rows: all.length });
    } catch (error) {
      if (error instanceof CsvExportError) {
        setStatus(`Could not export: ${error.displayMessage}`);
      } else {
        setStatus('Could not export this table.');
      }
      captureError(error, { feature: 'export-csv' });
    } finally {
      setBusy(false);
    }
  }, [collect, columns, currency, filename, resource, totalMinorOf]);

  return (
    <span
      className={pz('export-csv')}
      style={{ display: 'inline-flex', alignItems: 'center', gap: space[2] }}
    >
      <Button
        size="sm"
        variant="secondary"
        onClick={onExport}
        disabled={disabled || rows.length === 0}
        isLoading={isBusy}
      >
        Export CSV
      </Button>

      <span
        aria-live="polite"
        style={
          status.startsWith('Could not') || status.includes('more than')
            ? { fontFamily: font.family, fontSize: font.size.sm, color: color.danger }
            : (visuallyHidden as React.CSSProperties)
        }
      >
        {status}
      </span>
    </span>
  );
}
