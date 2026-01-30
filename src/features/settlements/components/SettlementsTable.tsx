/**
 * The settlements list table. Renamed from `SettlementsTable.tsx` in the PAY-2043 PR.
 *
 * Presentational: it takes rows and renders them. It does not call a fetching hook — that
 * would put an HTTP call inside a component two layers below the page, and then nobody can
 * tell what a route actually requests.
 */
import { useNavigate } from 'react-router-dom';

import { DataTable } from '@components/data/DataTable';
import { EmptyRows } from '@components/data/EmptyRows';
import { ROUTES } from '@/routes';
import type { SettlementRow } from '@types/view-models';

import { settlementColumns } from '../settlements.columns';

export interface SettlementTableProps {
  rows: ReadonlyArray<SettlementRow>;
  isLoading: boolean;
}

export function SettlementTable({ rows, isLoading }: SettlementTableProps) {
  const navigate = useNavigate();

  return (
