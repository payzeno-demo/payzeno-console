/**
 * The team members table, plus the invite form.
 *
 * This is the visible face of the legacy debt: the list comes from `useUsers` (a bare
 * `useEffect` + `api-fetch.ts`), so after an invite succeeds the parent has to call
 * `reload()` by hand. Every other table in this console just gets invalidated.
 *
 * a11y: the invite form is a real `<form>` with labelled inputs, and the success message is a
 * live region so the new member's name is announced.
 */
import { useState } from 'react';
import type { FormEvent } from 'react';

import { USER_ROLES } from '@payzeno/contracts';
import type { UserRole } from '@payzeno/contracts';

import { DataTable } from '@components/data/DataTable';
import type { ColumnDef } from '@components/data/DataTable';
import { DateCell } from '@components/data/DateCell';
import { EmptyRows } from '@components/data/EmptyRows';
import { InlineError } from '@components/feedback/InlineError';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Label } from '@components/ui/Label';
import { Select } from '@components/ui/Select';
import { humanise } from '@lib/format';
import type { TeamMemberRow } from '@/types/view-models';

const teamColumns: ReadonlyArray<ColumnDef<TeamMemberRow>> = [
  {
    id: 'full_name',
    header: 'Name',
    cell: (row) => (
      <span>
        {row.full_name}
        {row._isSelf ? ' (you)' : ''}
      </span>
    ),
    exportValue: (row) => row.full_name,
  },
  {
    id: 'email',
    header: 'Email',
    cell: (row) => <span>{row.email}</span>,
    exportValue: (row) => row.email,
  },
  {
    id: 'role',
    header: 'Role',
    cell: (row) => <span>{humanise(row.role)}</span>,
    exportValue: (row) => row.role,
  },
  {
    id: 'last_login_at',
    header: 'Last signed in',
    cell: (row) => <DateCell value={row.last_login_at} precision="minute" />,
    exportValue: (row) => row.last_login_at ?? '',
  },
];

export interface TeamTableProps {
  members: ReadonlyArray<TeamMemberRow>;
  isLoading: boolean;
  canInvite: boolean;
  isInviting: boolean;
  inviteError: string | null;
  onInvite: (args: { email: string; fullName: string; role: UserRole }) => void;
}

export function TeamTable({
  members,
  isLoading,
  canInvite,
  isInviting,
  inviteError,
  onInvite,
}: TeamTableProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('viewer');

}
