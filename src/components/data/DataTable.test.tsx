/**
 * `DataTable` — the frozen generic every list feature renders through (interfaces.md §4.2).
 *
 * The `caption` assertions are not decoration. A `<table>` with no caption is a table a
 * screen-reader user meets with no idea what they are in, and `caption` being a *required*
 * prop is the review comment that appears more often than any other in this repo's history.
 * Deleting these cases would let the prop quietly become optional again.
 */
import { describe, expect, it, vi } from 'vitest';

import { DataTable } from '@components/data/DataTable';
import type { ColumnDef } from '@components/data/column.types';
import { SKELETON_ROW_COUNT, VIRTUALISATION_THRESHOLD } from '@config/constants';
import { renderBare, screen, within } from '@/test/render';

interface Row {
  id: string;
  name: string;
  amount: number;
}

const rows: Row[] = [
  { id: 'row_1', name: 'Charlie', amount: 300 },
  { id: 'row_2', name: 'Alpha', amount: 100 },
  { id: 'row_3', name: 'Bravo', amount: 200 },
];

const columns: ReadonlyArray<ColumnDef<Row>> = [
  {
    id: 'name',
    header: 'Name',
    cell: (row) => row.name,
    exportValue: (row) => row.name,
    sortable: true,
  },
  {
    id: 'amount',
    header: 'Amount',
    align: 'end',
    cell: (row) => <span data-testid={`amount-${row.id}`}>{row.amount}</span>,
    exportValue: (row) => String(row.amount).padStart(6, '0'),
    sortable: true,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: (row) => <button type="button">Open {row.name}</button>,
  },
];

function renderTable(overrides: Partial<Parameters<typeof DataTable<Row>>[0]> = {}) {
  return renderBare(
    <DataTable<Row>
      caption="Test rows, newest first"
      columns={columns}
      rows={rows}
      isLoading={false}
      emptyState={<p>Nothing to show</p>}
      {...overrides}
    />,
  );
}

describe('accessibility contract', () => {
  it('renders the caption verbatim, so the table has an accessible name', () => {
    renderTable();

    const table = screen.getByRole('table', { name: /test rows, newest first/i });
    expect(table).toBeInTheDocument();
  });

  it('exposes aria-sort only on sortable columns', () => {
    renderTable();

    expect(screen.getByRole('columnheader', { name: /name/i })).toHaveAttribute(
      'aria-sort',
      'none',
    );
    expect(screen.getByRole('columnheader', { name: /actions/i })).not.toHaveAttribute(
      'aria-sort',
    );
  });

  it('makes the first cell a real button so the row is keyboard reachable', async () => {
    const onRowClick = vi.fn();
    const { user } = renderTable({ onRowClick });

    await user.tab();
    await user.keyboard('{Enter}');

    expect(onRowClick).toHaveBeenCalled();
  });
});

describe('windowing above the virtualisation threshold', () => {
  it('says so in the caption, so the count on screen is not a lie', () => {
    renderTable({ rows: many });

    expect(
      screen.getByRole('table', {
        name: new RegExp(`showing the first ${VIRTUALISATION_THRESHOLD} of ${many.length} rows`),
      }),
    ).toBeInTheDocument();
  });

});
