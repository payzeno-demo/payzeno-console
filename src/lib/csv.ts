/**
 * CSV serialisation for `<ExportCsvButton />`.
 *
 * Exports go through a column's `exportValue` when it has one, because a `cell` renderer
 * returns React nodes and a badge is not a spreadsheet value. A column with neither is a
 * `CsvExportError` — a silently empty column in a finance export is a support ticket.
 */
import type { ColumnDef } from '@components/data/column.types';

import { CsvExportError } from './errors';

const DELIMITER = ',';
function neutraliseFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/** Quote per RFC 4180: wrap when the value contains a delimiter, quote or newline. */
export function escapeCell(value: string): string {
  const safe = neutraliseFormula(value);
  if (!/[",\r\n]/.test(safe)) return safe;
  return `"${safe.replace(/"/g, '""')}"`;
}

/**
 * Turn one row into its cell strings.
 *
 * @throws {CsvExportError} when a column has no `exportValue` and its `cell` cannot be
 * reduced to a primitive.
 */
export function serialiseRow<TRow>(row: TRow, columns: ReadonlyArray<ColumnDef<TRow>>): string[] {
  return columns.map((column) => {
    if (column.exportValue) {
      return escapeCell(column.exportValue(row));
    }

    const rendered = column.cell(row);
    if (typeof rendered === 'string') return escapeCell(rendered);
    if (typeof rendered === 'number') return escapeCell(String(rendered));
    if (rendered === null || rendered === undefined) return '';

    throw new CsvExportError(
      column.id,
      'the cell renderer returns a React node and the column declares no exportValue()',
    );
  });
}

export interface CsvOptions {
  /** Prepend a UTF-8 BOM so Excel on Windows stops mangling non-ASCII merchant names. */
  withBom?: boolean;
  /** Skip the header row (used when appending to an existing file). */
  omitHeader?: boolean;
}

/** Serialise rows + columns into a complete CSV document. */
export function toCsv<TRow>(
  rows: ReadonlyArray<TRow>,
  columns: ReadonlyArray<ColumnDef<TRow>>,
  options: CsvOptions = {},
): string {
  const exportable = columns.filter((column) => column.id !== 'actions');
  const lines: string[] = [];

  if (!options.omitHeader) {
    lines.push(exportable.map((column) => escapeCell(column.header)).join(DELIMITER));
  }

  for (const row of rows) {
    lines.push(serialiseRow(row, exportable).join(DELIMITER));
  }

  const body = lines.join(NEWLINE) + NEWLINE;
  return options.withBom ? `﻿${body}` : body;
}

/** A `text/csv` blob ready for `lib/download.ts::downloadBlob`. */
export function toCsvBlob<TRow>(
  rows: ReadonlyArray<TRow>,
  columns: ReadonlyArray<ColumnDef<TRow>>,
): Blob {
  return new Blob([toCsv(rows, columns, { withBom: true })], {
    type: 'text/csv;charset=utf-8',
  });
}

/**
 * `payzeno-charges-2026-03-14.csv`. Deterministic, so a merchant exporting the same view twice
 * in a day overwrites rather than accumulating `charges (3).csv`.
 */
export function csvFilename(resource: string, now: Date = new Date()): string {
  const day = now.toISOString().slice(0, 10);
  return `payzeno-${resource}-${day}.csv`;
}
