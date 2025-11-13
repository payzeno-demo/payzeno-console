import { useNavigate } from 'react-router-dom';

import { DataTable } from '@components/data/DataTable';
import { DataTablePagination } from '@components/data/DataTablePagination';
import { DataTableToolbar } from '@components/data/DataTableToolbar';
import { EmptyRows } from '@components/data/EmptyRows';
import { ExportCsvButton } from '@components/data/ExportCsvButton';
import { ROUTES } from '@/routes';
import type { ChargeRow } from '@types/view-models';

import { chargeColumns } from '../charges.columns';

export interface ChargeTableProps {
  rows: ReadonlyArray<ChargeRow>;
  isLoading: boolean;
  hasMore: boolean;
  nextCursor: string | null;
  onCursorChange: (cursor: string | null) => void;
}

export function ChargeTable({
  rows,
  isLoading,
