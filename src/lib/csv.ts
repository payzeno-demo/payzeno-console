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

