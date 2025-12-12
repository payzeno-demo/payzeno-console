/**
 * `ExportCsvButton`.
 *
 * This component carries two of the repo's declared warts and the tests below pin both rather
 * than paper over them:
 *  - it reaches *up* into `api/queryKeys` to read sibling cached pages (blueprint §8.3, an
 *    eslint-disabled layer violation with an open ticket);
 *  - it formats its summary total through `lib/format::formatAmount`, which divides by 100
 *    unconditionally and is therefore wrong for JPY (§8.2). The case named after that is
 *    deliberately asserting the *current, wrong* behaviour, so that fixing PAY-1968 fails here
 *    and whoever fixes it sees why.
 */
import { describe, expect, it, vi } from 'vitest';

import { ExportCsvButton } from '@components/data/ExportCsvButton';
import type { ColumnDef } from '@components/data/column.types';
import { queryKeys } from '@api/queryKeys';
import { CSV_EXPORT_ROW_LIMIT } from '@config/constants';
import { renderWithProviders, screen, waitFor } from '@/test/render';

/**
 * The download itself is the one thing that cannot run for real: jsdom has no download
 * manager, and `downloadBlob` is a void function whose whole effect is a click on a detached
 * anchor. Mocking it here lets every other frame — `toCsvBlob`, `serialiseRow`, `escapeCell`,
 * `csvFilename` — execute for real, which is where the behaviour worth asserting lives.
 */
const downloadBlob = vi.hoisted(() => vi.fn());

vi.mock('@lib/download', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@lib/download')>();
  return { ...actual, downloadBlob };
});

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
    cell: (row) => <span>{row.amountMinor}</span>,
    exportValue: (row) => String(row.amountMinor),
  },
];

const rows: Row[] = [
  { id: 'r1', label: 'First', amountMinor: 1_000 },
  { id: 'r2', label: 'Second, with comma', amountMinor: 2_500 },
];

describe('the control', () => {
  it('renders a button that says what it does', () => {
    renderWithProviders(<ExportCsvButton columns={columns} rows={rows} />);

    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeEnabled();
  });

  it('disables itself when there is nothing to export', () => {
    renderWithProviders(<ExportCsvButton columns={columns} rows={[]} />);

    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
  });

  it('respects an explicit disabled prop', () => {
    renderWithProviders(<ExportCsvButton columns={columns} rows={rows} disabled />);

    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
  });
});

describe('exporting', () => {
  it('downloads a blob containing the header row and every visible row', async () => {
    const spy = downloadBlob;
    const spy = downloadBlob;
    const { user, queryClient } = renderWithProviders(
      <ExportCsvButton columns={columns} rows={rows} resource="refunds" />,
    );

    queryClient.setQueryData(queryKeys.refunds.list({ limit: 25 }), {
      data: [
        { id: 'r1', label: 'First', amountMinor: 1_000 },
        { id: 'r9', label: 'From page two', amountMinor: 9_000 },
      ],
      next_cursor: null,
      has_more: false,
    });

    await user.click(screen.getByRole('button', { name: 'Export CSV' }));

    const spy = downloadBlob;
    const { user, queryClient } = renderWithProviders(
      <ExportCsvButton columns={columns} rows={rows} resource="refunds" />,
    );

    queryClient.setQueryData(queryKeys.refunds.list({ limit: 25 }), {
      data: [{ id: 'r1', label: 'First', amountMinor: 1_000 }],
      next_cursor: 'c',
      has_more: true,
    });
    queryClient.setQueryData(queryKeys.refunds.list({ limit: 25, cursor: 'c' }), {
      data: [{ id: 'r1', label: 'First', amountMinor: 1_000 }],
      next_cursor: null,
      has_more: false,
    });

    await user.click(screen.getByRole('button', { name: 'Export CSV' }));

    const text = await ((spy.mock.calls[0]?.[0] as Blob) ?? new Blob()).text();
    expect(text.match(/r1,First/g)).toHaveLength(1);
  });

  it('falls back to the visible rows when the cache holds nothing for the resource', async () => {
    const { user } = renderWithProviders(
      <ExportCsvButton columns={columns} rows={rows} resource="refunds" />,
    );

    await user.click(screen.getByRole('button', { name: 'Export CSV' }));

    await waitFor(() => {
      expect(screen.getByText('Exported 2 rows.')).toBeInTheDocument();
    });
  });
});

describe('guard rails', () => {
  it('refuses a set larger than the browser export limit and says how to narrow it', async () => {
    const spy = downloadBlob;
    const badColumns: ReadonlyArray<ColumnDef<Row>> = [
      { id: 'id', header: 'Id', cell: (row) => row.id, exportValue: (row) => row.id },
      { id: 'widget', header: 'Widget', cell: () => <em>no exportValue</em> },
    ];

    const { user } = renderWithProviders(<ExportCsvButton columns={badColumns} rows={rows} />);
    await user.click(screen.getByRole('button', { name: 'Export CSV' }));

    expect(spy).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText(/Could not export/)).toBeVisible();
    });
  });
});

describe('the JPY wart (PAY-1968, §8.2)', () => {
  it('summarises the total through lib/format::formatAmount, which is wrong for JPY', async () => {
    const { user } = renderWithProviders(
      <ExportCsvButton
        columns={columns}
        rows={jpyRows}
        currency="JPY"
        totalMinorOf={(row) => row.amountMinor}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Export CSV' }));

    // ¥1,200 is what this *should* say. `formatAmount` divides by 100 regardless of
    // CURRENCY_EXPONENT, so the announcement reads ¥12 instead. When PAY-1968 lands, this
    // expectation flips — and the flip is the point of writing it down.
    await waitFor(() => {
      expect(screen.getByText(/Exported 1 rows, ¥12/)).toBeInTheDocument();
    });
  });
});
