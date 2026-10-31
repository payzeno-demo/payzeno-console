/**
 * The admin app's primary navigation, filtered by staff role.
 *
 * Same rule as the merchant `SideNav`: a section the role cannot open is hidden, not disabled —
 * a nav full of dead entries teaches people to ignore the nav. Individual actions inside a
 * section the role can read (approve, retry) are rendered disabled with a reason instead.
 */
import { Link, useLocation } from 'react-router-dom';

import { color, font, layout, radius, space } from '@components/ui/tokens';

import { ADMIN_ROUTES } from '../adminRoutes';
import type { AdminSection } from '../app/staff-roles';
import { useStaffPermissions } from '../app/StaffSessionContext';

export interface AdminNavItem {
  section: AdminSection;
  label: string;
  to: string;
  glyph: string;
}

export interface AdminNavGroup {
  id: string;
  label: string;
  items: ReadonlyArray<AdminNavItem>;
}

const ADMIN_NAV: ReadonlyArray<AdminNavGroup> = [
  {
    id: 'overview',
    label: 'Overview',
    items: [{ section: 'home', label: 'Home', to: ADMIN_ROUTES.home, glyph: '◱' }],
  },
  {
    id: 'accounts',
    label: 'Accounts',
    items: [{ section: 'merchants', label: 'Merchants', to: ADMIN_ROUTES.merchants.index, glyph: '▦' }],
  },
  {
    id: 'risk',
    label: 'Risk',
    items: [
      { section: 'reviews', label: 'Risk reviews', to: ADMIN_ROUTES.reviews.index, glyph: '⚑' },
      { section: 'disputes', label: 'Disputes', to: ADMIN_ROUTES.disputes.index, glyph: '⚖' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      { section: 'settlements', label: 'Settlements', to: ADMIN_ROUTES.settlements.index, glyph: '⇄' },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    items: [
      { section: 'support', label: 'Support tasks', to: ADMIN_ROUTES.support.index, glyph: '✉' },
      { section: 'emails', label: 'Email lookup', to: ADMIN_ROUTES.emails.index, glyph: '@' },
    ],
  },
];

function isActivePath(to: string, pathname: string): boolean {
  if (to === ADMIN_ROUTES.home) return pathname === ADMIN_ROUTES.home;
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AdminSideNav({ onNavigate }: { onNavigate?: () => void }) {
  const { canSee } = useStaffPermissions();
  const { pathname } = useLocation();

  const groups = ADMIN_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => canSee(item.section)),
  })).filter((group) => group.items.length > 0);

  return (
    <nav
      aria-label="Admin sections"
      style={{
        width: layout.sideNavWidth,
        flexShrink: 0,
        padding: space[3],
        borderRight: `1px solid ${color.border}`,
        background: color.surfaceMuted,
        fontFamily: font.family,
        overflowY: 'auto',
      }}
    >
      {groups.map((group) => (
        <div key={group.id} style={{ marginBottom: space[5] }}>
          <p
            id={`admin-nav-${group.id}`}
            style={{
              margin: `0 0 ${space[2]}`,
              padding: `0 ${space[3]}`,
              fontSize: font.size.xs,
              fontWeight: font.weight.semibold,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: color.textMuted,
            }}
          >
            {group.label}
          </p>
          <ul
            aria-labelledby={`admin-nav-${group.id}`}
            style={{ display: 'grid', gap: space[1], margin: 0, padding: 0 }}
          >
            {group.items.map((item) => {
              const active = isActivePath(item.to, pathname);
              return (
                <li key={item.section} style={{ listStyle: 'none' }}>
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: space[3],
                      padding: `${space[2]} ${space[3]}`,
                      borderRadius: radius.md,
                      fontSize: font.size.md,
                      fontWeight: active ? font.weight.semibold : font.weight.regular,
                      color: active ? color.brand : color.textSecondary,
                      background: active ? color.brandSubtle : 'transparent',
                      textDecoration: 'none',
                    }}
                  >
                    <span aria-hidden="true" style={{ width: space[4], textAlign: 'center' }}>
                      {item.glyph}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
