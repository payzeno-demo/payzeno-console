/**
 * The strip above a table: filters on the left, actions on the right.
 *
 * It is a `<search>`-flavoured region rather than a bare div so that a screen-reader user can
 * jump straight to the filters, and so the selection summary has somewhere polite to announce
 * itself from.
 *
 * Two call shapes, because the migration is half done:
 *
 *   <DataTableToolbar filters={<FilterBar/>} actions={<ExportCsvButton/>} resourceLabel="charges" />
 *   <DataTableToolbar label="Charge actions"><ExportCsvButton/></DataTableToolbar>
 *
 * The second is the older one: `children` land in the actions slot and `label` names the
 * region verbatim. TODO(rrefactor): converge on the first — PAY-1968.
 */
import type { ReactNode } from 'react';

import { pz } from '@lib/cn';
import { pluralise } from '@lib/format';

import { Button } from '../ui/Button';
import { color, font, radius, space } from '../ui/tokens';

export interface DataTableToolbarProps {
  /** `<FilterBar>` usually. */
  filters?: ReactNode;
  /** Export button, "New payout", etc. */
  actions?: ReactNode;
  /** Legacy shape: actions passed as children. */
  children?: ReactNode;
  /** Number of selected rows. Renders the bulk-action bar when non-zero. */
  selectedCount?: number;
  onClearSelection?: () => void;
  /** Bulk actions, shown only while a selection exists. */
  bulkActions?: ReactNode;
  /** What the table lists — "charges", "settlement items". */
  resourceLabel?: string;
  /** Legacy alias: used verbatim as the region's accessible name. */
  label?: string;
}

export function DataTableToolbar({
  filters,
  actions,
  children,
  selectedCount = 0,
  onClearSelection,
  bulkActions,
  resourceLabel,
  label,
}: DataTableToolbarProps) {
  const hasSelection = selectedCount > 0;
  const resource = resourceLabel ?? 'rows';
  const regionLabel = label ?? `Filter ${resource}`;
  const rightSlot = actions ?? children;

  return (
    <div className={pz('toolbar')} style={{ marginBottom: space[3] }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: space[4],
          flexWrap: 'wrap',
        }}
      >
        <div role="search" aria-label={regionLabel} style={{ flex: 1, minWidth: '240px' }}>
          {filters}
        </div>
        <div style={{ display: 'flex', gap: space[2] }}>{rightSlot}</div>
      </div>

      {hasSelection ? (
