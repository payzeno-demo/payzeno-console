import { screen, waitFor, within } from '@testing-library/react';

import { AdminApp } from './AdminApp';
import { renderAdmin } from './test/renderAdmin';

describe('admin app — session, shell and role gating', () => {
  it('sends a signed-out visitor to staff sign-in, then on to the page they asked for', async () => {
    const { user, db } = renderAdmin(<AdminApp />, { route: '/merchants', role: null });

    expect(await screen.findByRole('heading', { level: 1, name: 'Staff sign in' })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/work email/i), 'risk@staff.payzeno.example');
    await user.type(screen.getByLabelText(/^password/i), 'correct horse battery staple');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Merchants' })).toBeInTheDocument();
    expect(screen.getByTestId('staff-identity')).toHaveTextContent('Rina Risk');
    expect(screen.getByTestId('staff-identity')).toHaveTextContent('Risk');
    expect(db.session?.role).toBe('risk');
  });

  it('says only that the credentials do not match when sign-in fails', async () => {
    const { user } = renderAdmin(<AdminApp />, { route: '/login', role: null });

    await user.type(await screen.findByLabelText(/work email/i), 'nobody@example.com');
    await user.type(screen.getByLabelText(/^password/i), 'whatever');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That email and password do not match a staff account.',
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Staff sign in' })).toBeInTheDocument();
  });

  it('draws a shell that says Payzeno Admin, with the staff member and their role', async () => {
    renderAdmin(<AdminApp />, { route: '/', role: 'admin' });

    const identity = await screen.findByTestId('staff-identity');
    const banner = screen.getByRole('banner', { name: 'Payzeno Admin' });
    expect(within(banner).getByText('Payzeno Admin')).toBeInTheDocument();
    expect(within(banner).getByTestId('staff-identity')).toBe(identity);
    expect(within(identity).getByText('Avery Admin')).toBeInTheDocument();
    expect(identity).toHaveTextContent('Role: Admin');
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main-content');
  });

  it('shows an admin every section', async () => {
    renderAdmin(<AdminApp />, { route: '/', role: 'admin' });

    const nav = await screen.findByRole('navigation', { name: 'Admin sections' });
    for (const label of ['Home', 'Merchants', 'Risk reviews', 'Disputes', 'Settlements', 'Support tasks', 'Email lookup']) {
      expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('hides the sections a finance role cannot open', async () => {
    renderAdmin(<AdminApp />, { route: '/', role: 'finance' });

    const nav = await screen.findByRole('navigation', { name: 'Admin sections' });
    expect(within(nav).getByRole('link', { name: 'Merchants' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Settlements' })).toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: 'Risk reviews' })).not.toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: 'Disputes' })).not.toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: 'Support tasks' })).not.toBeInTheDocument();
  });

  it('denies a section to a role that types its URL anyway', async () => {
    renderAdmin(<AdminApp />, { route: '/reviews', role: 'support' });

    expect(
      await screen.findByRole('heading', { name: 'Your staff role does not include risk reviews' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/This needs the risk role/)).toBeInTheDocument();
  });

  it('signs out, clears the session and returns to sign-in', async () => {
    const { user, db } = renderAdmin(<AdminApp />, { route: '/', role: 'support' });

    await user.click(await screen.findByRole('button', { name: 'Sign out' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Staff sign in' })).toBeInTheDocument();
    expect(db.session).toBeNull();
    await waitFor(() => expect(screen.queryByTestId('staff-identity')).not.toBeInTheDocument());
  });

  it('renders a staff 404 for an unknown admin path', async () => {
    renderAdmin(<AdminApp />, { route: '/no-such-page', role: 'admin' });

    expect(await screen.findByRole('heading', { name: 'No such admin page' })).toBeInTheDocument();
  });
});
