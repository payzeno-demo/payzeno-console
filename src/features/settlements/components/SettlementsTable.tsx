/**
 * The settlements list table. Renamed from `SettlementsTable.tsx` in the PAY-2043 PR.
 *
 * Presentational: it takes rows and renders them. It does not call a fetching hook — that
 * would put an HTTP call inside a component two layers below the page, and then nobody can
 * tell what a route actually requests.
 */
import { useNavigate } from 'react-router-dom';

import { DataTable } from '@components/data/DataTable';
