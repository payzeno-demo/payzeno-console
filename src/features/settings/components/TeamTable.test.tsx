/**
 * `TeamTable` — RFC platform-v2 §4: invitations are emailed, and an invited member shows as
 * pending until they accept.
 */
import { describe, expect, it, vi } from 'vitest';

import { TeamTable } from '@features/settings/components/TeamTable';
import { makeUser } from '@/test/factories';
import { renderWithProviders, screen, within } from '@/test/render';
import type { TeamMemberRow } from '@/types/view-models';

function member(overrides: Parameters<typeof makeUser>[0]): TeamMemberRow {
  return { ...makeUser(overrides), _selected: false, _isSelf: false };
}

const members: TeamMemberRow[] = [
  member({ id: 'usr_active', full_name: 'Dana Finance', email: 'dana@northwind.example' }),
  member({
    id: 'usr_invited',
    full_name: 'Ida Invited',
    email: 'ida@northwind.example',
    role: 'viewer',
    last_login_at: null,
  }),
];

function renderTable(props: Partial<Parameters<typeof TeamTable>[0]> = {}) {
  return renderWithProviders(
    <TeamTable
      members={members}
      isLoading={false}
      canInvite
      isInviting={false}
      inviteError={null}
      onInvite={vi.fn()}
      {...props}
    />,
  );
}

describe('member states', () => {
  it('marks a member who never signed in as a pending invitation', () => {
    renderTable();

    const table = screen.getByRole('table', {
      name: 'People who can sign in to this Payzeno account',
    });
    const invitedRow = within(table).getByText('Ida Invited').closest('tr');
    const activeRow = within(table).getByText('Dana Finance').closest('tr');
    expect(invitedRow?.textContent).toMatch(/Invitation pending/);
    expect(activeRow?.textContent).toMatch(/Active/);
  });
});

describe('after inviting', () => {
  it('confirms the invitation email went out, in a live region', () => {
    renderTable({ invitedEmail: 'new@northwind.example' });

    expect(screen.getByTestId('invite-sent')).toHaveTextContent(
      /Invitation email sent to new@northwind\.example/,
    );
    expect(screen.getByTestId('invite-sent')).toHaveAttribute('role', 'status');
  });

  it('says nothing while an invite error is showing', () => {
    renderTable({ invitedEmail: 'new@northwind.example', inviteError: 'Already on this account.' });

    expect(screen.getByTestId('invite-sent')).toBeEmptyDOMElement();
  });
});
