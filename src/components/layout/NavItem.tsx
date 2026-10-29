/**
 * One row in the side navigation.
 *
 * The active state is computed from `types/nav.ts::isActive` rather than from React Router's
 * `NavLink` `isActive`, because a charge detail route (`/charges/ch_…`) must light up
 * "Charges" and `NavLink`'s default `end` semantics get that wrong in both directions.
 *
 * a11y (tflexbox, and the review comment is on PR #143 if you want the long version):
 *  - the active item gets `aria-current="page"`, not just a background colour;
 *  - the badge count is inside the link's accessible name — a red "3" that a screen reader
 *    reads as "three" after the word "Disputes" is fine; one that it does not read at all is
 *    an invisible alert;
 *  - the icon is decorative and `aria-hidden`.
 */
import { Link, useLocation } from 'react-router-dom';

import type { NavItemSpec } from '@/types/nav';
import { isActive } from '@/types/nav';

import { pz } from '@lib/cn';

import { Badge } from '../ui/Badge';
import { color, font, radius, space } from '../ui/tokens';

export interface NavItemProps {
  item: NavItemSpec;
  /** Count rendered as a badge — open disputes, failing webhook endpoints. */
  badgeCount?: number;
  /** Collapsed rail: label is visually hidden but stays in the accessible name. */
  collapsed?: boolean;
  onNavigate?: () => void;
}

/** Decorative glyph per nav id. No icon font in this repo — see `ui/IconButton.tsx`. */
const GLYPHS: Readonly<Record<string, string>> = {
  reporting: '◱',
  payments: '▤',
  charges: '▦',
  refunds: '↩',
  disputes: '⚖',
  balance: '⊞',
  payouts: '↗',
  settlements: '⇄',
  invoices: '▤',
  developers: '⌨',
  settings: '⚙',
  // RFC platform-v2
  customers: '☺',
  subscriptions: '↻',
  prices: '¤',
};

export function accessibleName(item: NavItemSpec, badgeCount?: number): string {
  if (badgeCount === undefined || badgeCount === 0) return item.label;
  return `${item.label}, ${badgeCount} needing attention`;
}

export function NavItem({ item, badgeCount, collapsed = false, onNavigate }: NavItemProps) {
  const { pathname } = useLocation();
  const active = isActive(item, pathname);

  return (
    <li style={{ listStyle: 'none' }}>
      <Link
        to={item.to}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        aria-label={collapsed ? accessibleName(item, badgeCount) : undefined}
        className={pz('nav-item', undefined, active ? 'active' : undefined)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: space[3],
          padding: `${space[2]} ${space[3]}`,
          borderRadius: radius.md,
          fontFamily: font.family,
          fontSize: font.size.md,
          fontWeight: active ? font.weight.semibold : font.weight.regular,
          color: active ? color.brand : color.textSecondary,
          background: active ? color.brandSubtle : 'transparent',
          textDecoration: 'none',
        }}
      >
        <span aria-hidden="true" style={{ width: '16px', textAlign: 'center' }}>
          {GLYPHS[item.id] ?? '•'}
        </span>

        {collapsed ? null : <span style={{ flex: 1 }}>{item.label}</span>}

        {!collapsed && badgeCount !== undefined && badgeCount > 0 ? (
          <Badge tone="danger" size="sm" srPrefix="Needing attention">
            {badgeCount > 99 ? '99+' : badgeCount}
          </Badge>
        ) : null}
      </Link>
    </li>
  );
}
