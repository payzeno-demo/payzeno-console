/**
 * The admin back office's chrome: environment banner, a dark top bar that says "Payzeno Admin"
 * (so nobody mistakes it for a merchant's console in the next tab), the signed-in staff member
 * and their role, sign out, the role-filtered side nav, and the content column.
 *
 * Same accessibility contract as the merchant `AppShell`: a skip link first in the tab order
 * targeting `#main-content` (each page's `<PageContainer as="main">`), one `banner`, one
 * navigation landmark, one polite live region for route changes, and the design tokens written
 * onto `:root` once.
 *
 * Without a staff session (the login page, the bootstrap in flight) it renders its children
 * bare, so `/login` gets no chrome.
 */
import type { StaffUser } from '@payzeno/contracts';
import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import { EnvironmentBanner } from '@components/layout/EnvironmentBanner';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { SKELETON_KEYFRAMES } from '@components/ui/Skeleton';
import { SPINNER_KEYFRAMES } from '@components/ui/Spinner';
import { color, cssVariables, font, layout, space, visuallyHidden } from '@components/ui/tokens';

import { STAFF_ROLE_LABELS } from '../app/staff-roles';
import { useStaffSessionState } from '../app/StaffSessionContext';

import { AdminSideNav } from './AdminSideNav';

export interface AdminShellProps {
  children: ReactNode;
  onSignOut: () => void;
  isSigningOut?: boolean;
  /** Override for tests; the app reads the session context. */
  staff?: StaffUser;
}

function useDesignTokens(): void {
  useEffect(() => {
    const root = document.documentElement;
    const applied = cssVariables();
    for (const [name, value] of Object.entries(applied)) root.style.setProperty(name, value);
    return () => {
      for (const name of Object.keys(applied)) root.style.removeProperty(name);
    };
  }, []);
}

function useRouteAnnouncement(): string {
  const { pathname } = useLocation();
  const [message, setMessage] = useState('');
  useEffect(() => {
    const first = pathname.split('/').filter(Boolean)[0];
    setMessage(first ? `Navigated to ${first.replace(/-/g, ' ')}` : 'Navigated to the admin overview');
  }, [pathname]);
  return message;
}

export function AdminShell({ children, onSignOut, isSigningOut = false, staff }: AdminShellProps) {
  const session = useStaffSessionState();
  const current = staff ?? session.staff;

  useDesignTokens();
  const announcement = useRouteAnnouncement();

  if (!current) return <>{children}</>;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: color.surfaceMuted,
        fontFamily: font.family,
        color: color.textPrimary,
      }}
    >
      <style>{`${SPINNER_KEYFRAMES}\n${SKELETON_KEYFRAMES}`}</style>

      <a
        href="#main-content"
        style={{
          position: 'absolute',
          insetInlineStart: space[2],
          insetBlockStart: `-${space[12]}`,
          zIndex: 100,
          padding: `${space[2]} ${space[4]}`,
          background: color.surface,
          color: color.textLink,
          border: `1px solid ${color.borderFocus}`,
        }}
        onFocus={(event) => {
          event.currentTarget.style.insetBlockStart = space[2];
        }}
        onBlur={(event) => {
          event.currentTarget.style.insetBlockStart = `-${space[12]}`;
        }}
      >
        Skip to content
      </a>

      <EnvironmentBanner />

      <header
        role="banner"
        aria-label="Payzeno Admin"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: space[4],
          height: layout.topBarHeight,
          padding: `0 ${space[5]}`,
          background: color.surfaceInverse,
          color: color.textInverse,
        }}
      >
        <p style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: space[3] }}>
          <span style={{ fontSize: font.size.lg, fontWeight: font.weight.semibold }}>Payzeno Admin</span>
          <span style={{ fontSize: font.size.sm, opacity: 0.8 }}>Staff back office</span>
        </p>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: space[3] }}>
          <p
            data-testid="staff-identity"
            style={{ margin: 0, display: 'flex', alignItems: 'center', gap: space[2], fontSize: font.size.md }}
          >
            <span>
              <span style={visuallyHidden as CSSProperties}>Signed in as </span>
              {current.full_name}
            </span>
            <span style={visuallyHidden as CSSProperties}>({current.email})</span>
            <Badge tone="brand" size="sm" srPrefix="Role">
              {STAFF_ROLE_LABELS[current.role]}
            </Badge>
          </p>
          <Button size="sm" variant="secondary" onClick={onSignOut} isLoading={isSigningOut}>
            Sign out
          </Button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <AdminSideNav />
        <div style={{ flex: 1, minWidth: 0, background: color.surface }}>{children}</div>
      </div>

      <span role="status" aria-live="polite" style={visuallyHidden as CSSProperties}>
        {announcement}
      </span>
    </div>
  );
}
