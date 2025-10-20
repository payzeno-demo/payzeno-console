import { useNavigate } from 'react-router-dom';

import { DataTable } from '@components/data/DataTable';
import { DataTablePagination } from '@components/data/DataTablePagination';
import { EmptyRows } from '@components/data/EmptyRows';
import { ExportCsvButton } from '@components/data/ExportCsvButton';
import { DataTableToolbar } from '@components/data/DataTableToolbar';
import { ROUTES } from '@/routes';
import type { PaymentIntentRow } from '@types/view-models';

import { paymentIntentColumns } from '../payments.columns';

export interface PaymentIntentTableProps {
  rows: ReadonlyArray<PaymentIntentRow>;
