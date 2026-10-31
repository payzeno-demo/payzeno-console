/**
 * DEAD CODE.
 *
 * Built behind the `settlement_explorer` flag before that flag defaulted on, as a bespoke
 * export panel for settlement batches. Superseded by the generic `ExportCsvButton` in
 * `components/data/`, which `SettlementItemTable` uses instead.
 *
 * Zero importers. Nobody has deleted it because the flag is still in `lib/flags.ts` and
 * removing the flag means auditing whether Sales still demos the explorer. They do not.
 *
 * TODO(rrefactor): delete alongside the `settlement_explorer` flag.
 */
import { useState } from 'react';

import type { CurrencyCode } from '@payzeno/contracts';

import { numberColumn, textColumn } from '@components/data/column.types';
import type { ColumnDef } from '@components/data/column.types';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Checkbox } from '@components/ui/Checkbox';
import { downloadText } from '@lib/download';
import { toCsv } from '@lib/csv';
import type { SettlementItemRow } from '@/types/view-models';

export interface SettlementExportPanelProps {
  batchId: string;
  currency: CurrencyCode;
  rows: ReadonlyArray<SettlementItemRow>;
}

interface ExportOptions {
  includeFees: boolean;
  includeUnmatched: boolean;
  includeVariance: boolean;
}

export function SettlementExportPanel({ batchId, currency, rows }: SettlementExportPanelProps) {
  const [options, setOptions] = useState<ExportOptions>({
    includeFees: true,
    includeUnmatched: false,
    includeVariance: true,
  });

  const toggle = (key: keyof ExportOptions) =>
    setOptions((current) => ({ ...current, [key]: !current[key] }));

  const handleExport = () => {
    const selected = rows.filter((row) => options.includeUnmatched || row.charge_id !== null);

    const columns: ColumnDef<SettlementItemRow>[] = [
      textColumn('item_id', 'item_id', (row) => row.id),
      textColumn('charge_id', 'charge_id', (row) => row.charge_id),
      textColumn('line_type', 'line_type', (row) => row.line_type),
      numberColumn('gross_minor', 'gross_minor', (row) => row.gross_minor),
      textColumn('currency', 'currency', () => currency),
      ...(options.includeFees
        ? [numberColumn<SettlementItemRow>('fee_minor', 'fee_minor', (row) => row.fee_minor)]
        : []),
      ...(options.includeVariance
        ? [
            numberColumn<SettlementItemRow>(
              'variance_minor',
              'variance_minor',
              (row) => row.variance_minor,
            ),
          ]
        : []),
      textColumn('status', 'status', (row) => row.status),
    ];

    downloadText(toCsv(selected, columns), `settlement-${batchId}-explorer.csv`, 'text/csv');
  };

  return (
    <Card as="section" aria-label="Export settlement items">
      <h2>Export</h2>

      <Checkbox
        id="export-fees"
        label="Include acquirer fees"
        checked={options.includeFees}
        onCheckedChange={() => toggle('includeFees')}
      />
      <Checkbox
        id="export-unmatched"
        label="Include unmatched lines"
        checked={options.includeUnmatched}
        onCheckedChange={() => toggle('includeUnmatched')}
      />
      <Checkbox
        id="export-variance"
        label="Include variance"
        checked={options.includeVariance}
        onCheckedChange={() => toggle('includeVariance')}
      />

      <Button type="button" onClick={handleExport} disabled={rows.length === 0}>
        Download CSV
      </Button>
    </Card>
  );
}
