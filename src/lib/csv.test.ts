/**
 * `lib/csv.ts`.
 *
 * Two things here are security-adjacent rather than cosmetic:
 *  - **formula injection.** A cell starting `=`, `+`, `-` or `@` is executed by Excel when the
 *    file is opened. A merchant's own `statement_descriptor` is attacker-controllable in a
 *    marketplace, so every cell is neutralised on the way out.
 *  - **quoting.** A comma or a newline inside a cell silently shifts every column after it,
 *    which produces a reconciliation file that is wrong rather than obviously broken.
 */
import { describe, expect, it } from 'vitest';

import type { ColumnDef } from '@components/data/column.types';
import { csvFilename, escapeCell, serialiseRow, toCsv, toCsvBlob } from '@lib/csv';
import { CsvExportError } from '@lib/errors';

interface Row {
  id: string;
  label: string;
  amountMinor: number;
}

const columns: ReadonlyArray<ColumnDef<Row>> = [
  { id: 'id', header: 'Id', cell: (row) => row.id, exportValue: (row) => row.id },
  { id: 'label', header: 'Label', cell: (row) => row.label, exportValue: (row) => row.label },
  {
    id: 'amount',
    header: 'Amount',
    cell: (row) => row.amountMinor,
    exportValue: (row) => String(row.amountMinor),
  },
];

const rows: Row[] = [
  { id: 'r1', label: 'First', amountMinor: 1_000 },
  { id: 'r2', label: 'Second', amountMinor: 2_500 },
];

describe('escapeCell', () => {
  it('leaves an ordinary value alone', () => {
    expect(escapeCell('Northwind')).toBe('Northwind');
  });

  it('quotes a value containing a comma', () => {
    expect(escapeCell('Northwind, Ltd')).toBe('"Northwind, Ltd"');
  });

  it('doubles an embedded quote', () => {
    expect(escapeCell('He said "hello"')).toBe('"He said ""hello"""');
  });

  it('quotes a value containing a newline', () => {
    expect(escapeCell('line one\nline two')).toBe('"line one\nline two"');
  });

  it.each(['=1+1', '+SUM(A1)', '-2+3', '@import', '\tTAB'])(
    'neutralises the formula-leading value %j',
    (value) => {
      expect(escapeCell(value).startsWith("'")).toBe(true);
    },
  );

  it('quotes a neutralised value that also contains a comma', () => {
    expect(escapeCell('=HYPERLINK("a","b")')).toBe(`"'=HYPERLINK(""a"",""b"")"`);
  });

  it('leaves an empty cell empty', () => {
    expect(escapeCell('')).toBe('');
  });
});

describe('serialiseRow', () => {
  it('uses exportValue when a column declares one', () => {
    expect(serialiseRow(rows[0]!, columns)).toEqual(['r1', 'First', '1000']);
  });

  it('falls back to a string cell renderer', () => {
    const plain: ColumnDef<Row>[] = [{ id: 'label', header: 'Label', cell: (row) => row.label }];

    expect(serialiseRow(rows[0]!, plain)).toEqual(['First']);
  });

  it('falls back to a numeric cell renderer', () => {
    const numeric: ColumnDef<Row>[] = [
      { id: 'amount', header: 'Amount', cell: (row) => row.amountMinor },
    ];

    expect(serialiseRow(rows[0]!, numeric)).toEqual(['1000']);
  });

  it('renders a null cell as empty rather than as "null"', () => {
    const nullable: ColumnDef<Row>[] = [{ id: 'x', header: 'X', cell: () => null }];

    expect(serialiseRow(rows[0]!, nullable)).toEqual(['']);
  });

  it('throws CsvExportError naming the column when a cell is a React node', () => {
    const nodeColumn: ColumnDef<Row>[] = [
      { id: 'widget', header: 'Widget', cell: () => ({ type: 'div' }) as never },
    ];

    const thrown = (() => {
      try {
        serialiseRow(rows[0]!, nodeColumn);
        return null;
      } catch (error) {
        return error;
      }
    })();

    expect(thrown).toBeInstanceOf(CsvExportError);
    expect((thrown as CsvExportError).columnId).toBe('widget');
  });
});

describe('toCsv', () => {
  it('writes a header row followed by the data', () => {
    const csv = toCsv(rows, columns);

    expect(csv.split('\r\n')[0]).toBe('Id,Label,Amount');
    expect(csv).toContain('r1,First,1000');
    expect(csv).toContain('r2,Second,2500');
  });

  it('uses CRLF, which is what Excel expects', () => {
    expect(toCsv(rows, columns)).toContain('\r\n');
  });

  it('ends with a trailing newline', () => {
    expect(toCsv(rows, columns).endsWith('\r\n')).toBe(true);
  });

  it('omits the header when asked', () => {
    expect(toCsv(rows, columns, { omitHeader: true }).startsWith('Id,')).toBe(false);
  });

  it('drops the actions column, which has nothing exportable in it', () => {
    const withActions: ColumnDef<Row>[] = [
      ...columns,
      { id: 'actions', header: 'Actions', cell: () => null },
    ];

    expect(toCsv(rows, withActions).split('\r\n')[0]).toBe('Id,Label,Amount');
  });

  it('writes a header-only file for an empty row set', () => {
    expect(toCsv([], columns)).toBe('Id,Label,Amount\r\n');
  });

  it('prefixes a BOM when asked, so Excel reads it as UTF-8', () => {
    expect(toCsv(rows, columns, { withBom: true }).charCodeAt(0)).toBe(0xfeff);
  });
});

describe('toCsvBlob', () => {
  it('produces a UTF-8 CSV blob', () => {
    const blob = toCsvBlob(rows, columns);

    expect(blob.type).toBe('text/csv;charset=utf-8');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('includes the BOM', async () => {
    const text = await toCsvBlob(rows, columns).text();

    expect(text.charCodeAt(0)).toBe(0xfeff);
  });
});

describe('csvFilename', () => {
  it('names the file after the resource and the day', () => {
    expect(csvFilename('settlements', new Date('2026-03-14T09:00:00Z'))).toBe(
      'payzeno-settlements-2026-03-14.csv',
    );
  });

  it('always ends in .csv', () => {
    expect(csvFilename('export').endsWith('.csv')).toBe(true);
  });
});
