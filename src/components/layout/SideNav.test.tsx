/**
 * `SideNav`.
 *
 * The nav is where the permission model becomes visible: a viewer must not be shown a link to
 * a page that will greet them with `<PermissionDenied/>`. `visibleSections` does the filtering
 * and this file drives it through the real `usePermissions` → `SessionContext` chain rather
 * than by calling the pure function, because the wiring is the part that breaks.
 *
 * Note the flag seam: `SideNav` reads `isFlagEnabled` from `lib/flags` directly, not the
 * `FlagsProvider` context, so a `flags` override on the test render has no effect here. That
 * is the build-time-flags design (§8), not an oversight, and the case at the bottom says so.
 */
import { describe, expect, it, vi } from 'vitest';

import { NAV_SECTIONS, SideNav } from '@components/layout/SideNav';
import { isFlagEnabled } from '@lib/flags';
import { ROUTES } from '@/routes';
import { makeConsoleSession, makeViewerSession } from '@/test/factories';
import { renderWithProviders, screen, within } from '@/test/render';

describe('NAV_SECTIONS', () => {
  it('groups every top-level route under exactly one section', () => {
    const targets = NAV_SECTIONS.flatMap((section) => section.items.map((item) => item.to));

    expect(new Set(targets).size).toBe(targets.length);
    expect(targets).toContain(ROUTES.settlements.index);
    expect(targets).toContain(ROUTES.developers.index);
  });

  it('gives every item a required permission — no link is unguarded', () => {
    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        expect(item.requiredPermission).toBeTruthy();
      }
    }
  });

  it('marks the detail-bearing features as prefix matches', () => {
    const byId = new Map(
      NAV_SECTIONS.flatMap((section) => section.items).map((item) => [item.id, item]),
    );

    expect(byId.get('settlements')?.matchPrefix).toBe(true);
    expect(byId.get('payouts')?.matchPrefix).toBe(true);
    // Refunds has no detail route, so a prefix match would be a lie.
    expect(byId.get('refunds')?.matchPrefix).toBeUndefined();
  });
});

describe('as an owner', () => {
  it('is a labelled primary navigation landmark', () => {
    renderWithProviders(<SideNav />);

    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
  });

  it('shows every section heading', () => {
    renderWithProviders(<SideNav />);

    for (const section of NAV_SECTIONS) {
      expect(screen.getByText(section.label)).toBeInTheDocument();
    }
  });

  it('links each item at its route constant', () => {
    renderWithProviders(<SideNav />);

    expect(screen.getByRole('link', { name: 'Payouts' })).toHaveAttribute(
      'href',
      ROUTES.payouts.index,
    );
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      ROUTES.settings.index,
    );
  });

  it('marks the current route with aria-current', () => {
    renderWithProviders(<SideNav />, { route: ROUTES.disputes.index });

    expect(screen.getByRole('link', { name: /Disputes/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('keeps the parent item current on a detail route, for prefix-matching items', () => {
    renderWithProviders(<SideNav />, {
      route: ROUTES.settlements.detail('sb_01HW0RTBATCH000000001'),
    });

    expect(screen.getByRole('link', { name: /Settlements/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('does not mark a non-prefix item current on a sibling route', () => {
    renderWithProviders(<SideNav />, { route: '/refunds/whatever' });

    expect(screen.getByRole('link', { name: 'Refunds' })).not.toHaveAttribute('aria-current');
  });
});

describe('as a viewer', () => {
  it('hides the links a viewer cannot use', () => {
    renderWithProviders(<SideNav />, { session: makeViewerSession() });

    expect(screen.queryByRole('link', { name: 'Payouts' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument();
  });

  it('drops a section entirely once all its items are hidden', () => {
    renderWithProviders(<SideNav />, { session: makeViewerSession() });

    expect(screen.queryByText('Account')).not.toBeInTheDocument();
  });

  it('shows the full nav again for a session that holds the permissions', () => {
    renderWithProviders(<SideNav />, { session: makeConsoleSession() });

    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
  });
});

describe('badges', () => {
  it('renders a count on the item that declared a badge key', () => {
    renderWithProviders(<SideNav badges={{ disputes: 4 }} />);

    const link = screen.getByRole('link', { name: /Disputes/ });
    expect(within(link).getByText('4')).toBeInTheDocument();
  });

  it('announces what the count means', () => {
    renderWithProviders(<SideNav badges={{ disputes: 4 }} />);

    expect(screen.getByText('Needing attention:')).toBeInTheDocument();
  });

  it('renders nothing at zero', () => {
    renderWithProviders(<SideNav badges={{ disputes: 0 }} />);

    expect(screen.queryByText('Needing attention:')).not.toBeInTheDocument();
  });

  it('caps a large count at 99+', () => {
    renderWithProviders(<SideNav badges={{ webhooks: 250 }} />);

    const link = screen.getByRole('link', { name: /Developers/ });
    expect(within(link).getByText('99+')).toBeInTheDocument();
  });
});

describe('the collapsed rail', () => {
  it('drops the section headings and the labels', () => {
    renderWithProviders(<SideNav collapsed />);

    expect(screen.queryByText('Money in')).not.toBeInTheDocument();
  });

  it('names each link for a screen reader even without visible text', () => {
    renderWithProviders(<SideNav collapsed badges={{ disputes: 2 }} />);

    expect(
      screen.getByRole('link', { name: 'Disputes, 2 needing attention' }),
    ).toBeInTheDocument();
  });

  it('reports navigation so the shell can close the drawer', async () => {
    const onNavigate = vi.fn();
    const { user } = renderWithProviders(<SideNav onNavigate={onNavigate} />);

    await user.click(screen.getByRole('link', { name: 'Balance' }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});

describe('the settlement_explorer flag', () => {
  it('shows Settlements while the build-time flag is on', () => {
    expect(isFlagEnabled('settlement_explorer')).toBe(true);
    renderWithProviders(<SideNav />);

    expect(screen.getByRole('link', { name: /Settlements/ })).toBeInTheDocument();
  });

  it('ignores a context-level flag override — the nav reads the build-time value', () => {
    // If this ever starts passing with the link hidden, `SideNav` has been switched onto
    // `useFlag`, and §8's "build-time values, no network" claim needs revisiting.
    renderWithProviders(<SideNav />, { flags: { settlement_explorer: false } });

    expect(screen.getByRole('link', { name: /Settlements/ })).toBeInTheDocument();
  });
});
