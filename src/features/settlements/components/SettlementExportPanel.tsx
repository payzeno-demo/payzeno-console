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

import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Checkbox } from '@components/ui/Checkbox';
import { downloadBlob } from '@lib/download';
import { toCsv } from '@lib/csv';
import type { SettlementItemRow } from '@types/view-models';

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

    const csv = toCsv(
      selected.map((row) => ({
        item_id: row.id,
        charge_id: row.charge_id ?? '',
        line_type: row.line_type,
        gross_minor: row.gross_minor,
        currency,
        ...(options.includeFees ? { fee_minor: row.fee_minor } : {}),
        ...(options.includeVariance ? { variance_minor: row.variance_minor } : {}),
        status: row.status,
      })),
    );

    downloadBlob(csv, `settlement-${batchId}-explorer.csv`, 'text/csv');
  };

  return (
    <Card as="section" aria-label="Export settlement items">
      <h2>Export</h2>

      <Checkbox
        id="export-fees"
        label="Include acquirer fees"
        checked={options.includeFees}
