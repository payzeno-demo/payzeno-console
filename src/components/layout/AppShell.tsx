/**
 * The application chrome: environment banner, top bar, side nav, content column.
 *
 * This is the file that mounts `<NotificationBell />`, which is the **one** declared
 * `components → features` import in the repo (interfaces.md §4.1 puts the bell in the shell,
 * and `features/notifications` has no page of its own to put it on). The eslint-disable below
 * is the whole exception; there is exactly one other, in `components/data/ExportCsvButton.tsx`,
 * and it has a ticket.
 *
 * Accessibility contract, asserted by `AppShell.test.tsx`:
 *  - a skip link is the first focusable element on the page and targets `#main-content`;
 *  - exactly one `role="banner"`, one `role="navigation"` named "Primary", one `<main>`;
 *  - the route-change announcement lives in one polite live region here, not per page;
 *  - the design tokens are written to `:root` once, from `cssVariables()`.
 *
 * Session data comes from props when the caller has it and from `SessionContext` otherwise, so
 * the shell can be rendered in a test without standing up every provider.
 */
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import type { Merchant, User } from '@payzeno/contracts';

import { useSessionContext } from '@app/SessionContext';
// eslint-disable-next-line no-restricted-imports -- interfaces.md §4.1: the bell lives in the shell
import { NotificationBell } from '@features/notifications/NotificationBell';
import { pz } from '@lib/cn';

import { SKELETON_KEYFRAMES } from '../ui/Skeleton';
import { SPINNER_KEYFRAMES } from '../ui/Spinner';
import { color, cssVariables, font, layout, space, visuallyHidden } from '../ui/tokens';

import { EnvironmentBanner } from './EnvironmentBanner';
import { SideNav } from './SideNav';
import { TopBar } from './TopBar';

export interface AppShellProps {
  children: ReactNode;
  /** Overrides for the session-derived values. Tests pass these; the app does not. */
  user?: User;
  merchant?: Merchant;
  onSignOut?: () => void;
  onLivemodeChange?: (next: boolean) => void;
  onSwitchMerchant?: (merchantId: string) => void;
  /** Nav badge counts, keyed by `NavItemSpec.badgeKey`. */
  badges?: Partial<Record<'disputes' | 'webhooks', number>>;
}

/**
 * Write the design tokens onto `:root` as custom properties, once. Keeping them in CSS as well
 * as in TS is what lets the print stylesheet and the (still hypothetical) dark theme override a
 * colour without every component re-rendering.
 */
function useDesignTokens(): void {
  useEffect(() => {
    const root = document.documentElement;
    const applied = cssVariables();

    for (const [name, value] of Object.entries(applied)) {
      root.style.setProperty(name, value);
    }

    return () => {
      for (const name of Object.keys(applied)) root.style.removeProperty(name);
    };
  }, []);
}

/** One live region for route changes, instead of every page announcing itself differently. */
function useRouteAnnouncement(): string {
  const { pathname } = useLocation();
  const [message, setMessage] = useState('');

  useEffect(() => {
    const first = pathname.split('/').filter(Boolean)[0];
    setMessage(first ? `Navigated to ${first.replace(/-/g, ' ')}` : 'Navigated to the dashboard');
  }, [pathname]);

  return message;
}

export function AppShell({
  children,
  user,
  merchant,
  onSignOut,
  onLivemodeChange,
  onSwitchMerchant,
  badges,
}: AppShellProps) {
  const session = useSessionContext();
  const [navOpen, setNavOpen] = useState(false);

  useDesignTokens();
  const announcement = useRouteAnnouncement();

  const currentUser = user ?? session?.user;
  const currentMerchant = merchant ?? session?.merchant;
  const livemode = session?._livemode ?? currentMerchant?.livemode ?? false;

  // Before the bootstrap call resolves there is no shell to draw — `RequireSession` is what
  // renders the loading state, so this just gets out of the way.
  if (!currentUser || !currentMerchant) {
    return <>{children}</>;
  }

  return (
    <div
      className={pz('app-shell')}
      style={{
        display: 'flex',
        flexDirection: 'column',
