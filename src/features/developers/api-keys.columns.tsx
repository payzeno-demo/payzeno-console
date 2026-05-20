/**
 * `ColumnDef<ApiKeyRow>[]`.
 *
 * The key column renders `prefix…last_four` and nothing else. There is no "reveal" control
 * and no copy-the-secret action: the plaintext exists exactly once, in
 * `<SecretRevealOnce />`, immediately after creation.
 */
import { Link } from 'react-router-dom';

import type { ApiKeyScope } from '@payzeno/contracts';

import type { ColumnDef } from '@components/data/DataTable';
import { DateCell } from '@components/data/DateCell';
import { StatusPill } from '@components/data/StatusPill';
import { listSentence, pluralise } from '@lib/format';
import { ROUTES } from '@/routes';
import type { ApiKeyRow } from '@/types/view-models';

/** Write scopes are the ones worth calling out — a read key leaking is a different incident. */
export function writeScopesOf(scopes: ReadonlyArray<ApiKeyScope>): ApiKeyScope[] {
  return scopes.filter((scope) => scope.endsWith(':write'));
}

export function scopeSummary(scopes: ReadonlyArray<ApiKeyScope>): string {
  const writes = writeScopesOf(scopes);
  if (writes.length === 0) return `${pluralise(scopes.length, 'read scope')}`;
  return listSentence(writes.map((scope) => scope.replace(':write', '')));
}

export const apiKeyColumns: ReadonlyArray<ColumnDef<ApiKeyRow>> = [
  {
    id: 'name',
    header: 'Name',
    cell: (row) => <Link to={ROUTES.developers.apiKey(row.id)}>{row.name}</Link>,
    exportValue: (row) => row.name,
  },
  {
    id: 'key',
    header: 'Key',
    cell: (row) => (
      <code>
        {row.prefix}…{row.last_four}
      </code>
    ),
    exportValue: (row) => `${row.prefix}...${row.last_four}`,
  },
  {
    id: 'mode',
