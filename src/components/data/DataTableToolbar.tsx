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
