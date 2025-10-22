/**
 * `AppShell` — the frame every signed-in route renders inside.
 *
 * It carries one of the two deliberate layer violations in the repo (§8.3): the shell imports
 * `features/notifications/NotificationBell`, because interfaces.md §4.1 puts the bell in the
 * shell and there is nowhere else for it to live. The eslint-disable comment above that import
 * is load-bearing, and the case at the bottom is its receipt.
 */
import { describe, expect, it, vi } from 'vitest';

import { AppShell } from '@components/layout/AppShell';
import { makeConsoleSession, makeMerchant, makeUser } from '@/test/factories';
import { renderWithProviders, screen } from '@/test/render';

describe('before a session exists', () => {
  it('renders the children bare, leaving the loading state to RequireSession', () => {
    renderWithProviders(
      <AppShell>
        <p>Route content</p>
      </AppShell>,
      { session: null },
    );

    expect(screen.getByText('Route content')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Primary' })).not.toBeInTheDocument();
  });
});

describe('with a session', () => {
  it('publishes the token custom properties onto the document root', () => {
    renderWithProviders(
      <AppShell>
        <p>Route content</p>
      </AppShell>,
    );

    expect(document.documentElement.style.getPropertyValue('--pz-color-brand')).not.toBe('');
  });

  it('mounts the bell in the shell, as interfaces.md §4.1 requires', () => {
    renderWithProviders(
      <AppShell>
        <p>Route content</p>
      </AppShell>,
    );

    expect(
      screen.getByRole('button', { name: /Notifications, none unread/ }),
    ).toBeInTheDocument();
  });
});

describe('the shell callbacks', () => {
});
