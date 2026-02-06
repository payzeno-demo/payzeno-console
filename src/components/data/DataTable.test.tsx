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

  it('reports the total row count on the table, not the rendered count', () => {
    renderTable();

    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '3');
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

  it('marks itself busy while loading', () => {
    renderTable({ isLoading: true });

    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
  });
});

describe('rows', () => {
  it('keys rows by id, so a re-render with reordered rows does not remount cells', () => {
    const { rerender } = renderTable();
    const before = screen.getByTestId('amount-row_2');

    rerender(
      <DataTable<Row>
        caption="Test rows, newest first"
        columns={columns}
        rows={[...rows].reverse()}
        isLoading={false}
        emptyState={<p>Nothing to show</p>}
      />,
    );

    expect(screen.getByTestId('amount-row_2')).toBe(before);
  });
});

describe('loading and empty states', () => {
  it('renders skeleton rows instead of data while loading', () => {
    renderTable({ isLoading: true, rows: [] });

    // The skeletons are aria-hidden, so they add no rows to the accessibility tree.
    const table = screen.getByRole('table');
    expect(within(table).queryAllByRole('row')).toHaveLength(1);
    expect(table.querySelectorAll('tbody tr')).toHaveLength(SKELETON_ROW_COUNT);
  });

  it('renders the empty state only when loading has finished', () => {
    const { rerender } = renderTable({ isLoading: true, rows: [] });
    expect(screen.queryByText('Nothing to show')).not.toBeInTheDocument();

    rerender(
      <DataTable<Row>
        caption="Test rows, newest first"
        columns={columns}
        rows={[]}
        isLoading={false}
        emptyState={<p>Nothing to show</p>}
      />,
    );

    expect(screen.getByText('Nothing to show')).toBeInTheDocument();
  });

  it('spans the empty state across every column', () => {
    renderTable({ rows: [], isLoading: false });

    const cell = screen.getByText('Nothing to show').closest('td');
    expect(cell).toHaveAttribute('colspan', String(columns.length));
  });
});

describe('sorting', () => {
  it('toggles to descending on the second click of the same header', async () => {
    const { user } = renderTable();
    const header = screen.getByRole('button', { name: /name/i });

    await user.click(header);
    await user.click(header);

    const cells = screen.getAllByRole('cell').filter((cell) => cell.cellIndex === 0);
    expect(cells.map((cell) => cell.textContent)).toEqual(['Charlie', 'Bravo', 'Alpha']);
    expect(screen.getByRole('columnheader', { name: /name/i })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
  });

  it('restarts at ascending when a different column takes over', async () => {
    const { user } = renderTable();

    await user.click(screen.getByRole('button', { name: /name/i }));
    await user.click(screen.getByRole('button', { name: /name/i }));
    await user.click(screen.getByRole('button', { name: /amount/i }));

    expect(screen.getByRole('columnheader', { name: /amount/i })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    expect(screen.getByRole('columnheader', { name: /name/i })).toHaveAttribute(
      'aria-sort',
      'none',
    );
  });

  it('offers no sort control on a column that did not ask for one', () => {
    renderTable();

    expect(screen.queryByRole('button', { name: /^actions/i })).not.toBeInTheDocument();
  });
});

describe('row interaction', () => {
  it('does not fire onRowClick when an interactive child was the target', async () => {
    const onRowClick = vi.fn();
    const { user } = renderTable({ onRowClick });

    await user.click(screen.getByRole('button', { name: 'Open Alpha' }));

    expect(onRowClick).not.toHaveBeenCalled();
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
  const many: Row[] = Array.from({ length: VIRTUALISATION_THRESHOLD + 25 }, (_, index) => ({
    id: `row_${index}`,
    name: `Name ${index}`,
    amount: index,
  }));

  it('renders only the capped window', () => {
    renderTable({ rows: many });

    expect(screen.getAllByRole('row')).toHaveLength(VIRTUALISATION_THRESHOLD + 1);
  });

  it('says so in the caption, so the count on screen is not a lie', () => {
    renderTable({ rows: many });

    expect(
      screen.getByRole('table', {
        name: new RegExp(`showing the first ${VIRTUALISATION_THRESHOLD} of ${many.length} rows`),
      }),
    ).toBeInTheDocument();
  });

});
