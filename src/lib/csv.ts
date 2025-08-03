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

