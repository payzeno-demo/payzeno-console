/**
 * The primary navigation.
 *
 * The tree is data (`NAV_SECTIONS` below, built from `src/routes.ts`) and it is filtered
 * through `types/nav.ts::visibleSections`, so permission and flag gating happen in one pure
 * function that `SideNav.test.tsx` can drive without a router.
 *
 * A route the session cannot reach is **hidden**, not disabled — unlike buttons, which are
 * disabled with a reason. That asymmetry is deliberate: a nav full of dead entries teaches
 * users to ignore the nav.
 *
 * a11y: `<nav aria-label="Primary">`, one `<ul>` per section with the section label as the
 * group's accessible name, and the whole thing is reachable from the skip link in `AppShell`.
 */
import { ROUTES } from '@/routes';
import type { NavSection } from '@/types/nav';
import { visibleSections } from '@/types/nav';

import { usePermissions } from '@hooks/usePermissions';
import { pz } from '@lib/cn';
import { isFlagEnabled } from '@lib/flags';

import { color, font, layout, space } from '../ui/tokens';

import { NavItem } from './NavItem';

export interface SideNavProps {
  /** Counts keyed by `NavItemSpec.badgeKey`. */
  badges?: Partial<Record<'disputes' | 'webhooks', number>>;
  collapsed?: boolean;
  /** Called after a navigation, so the mobile drawer can close itself. */
  onNavigate?: () => void;
}

/**
 * The one description of the app's shape. `src/routes.ts` owns the paths; this owns the order,
 * the grouping and the permission each entry needs.
 */
export const NAV_SECTIONS: ReadonlyArray<NavSection> = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      { id: 'reporting', label: 'Home', to: ROUTES.reporting.index, requiredPermission: 'reporting:read' },
      { id: 'balance', label: 'Balance', to: ROUTES.balance.index, requiredPermission: 'balance:read' },
    ],
  },
  {
    id: 'money-in',
    label: 'Money in',
    items: [
      {
        id: 'payments',
        label: 'Payments',
        to: ROUTES.payments.index,
        requiredPermission: 'payments:read',
        matchPrefix: true,
      },
      {
        id: 'charges',
        label: 'Charges',
        to: ROUTES.charges.index,
        requiredPermission: 'payments:read',
        matchPrefix: true,
      },
      { id: 'refunds', label: 'Refunds', to: ROUTES.refunds.index, requiredPermission: 'payments:read' },
      {
        id: 'disputes',
        label: 'Disputes',
        to: ROUTES.disputes.index,
        requiredPermission: 'disputes:read',
        badgeKey: 'disputes',
        matchPrefix: true,
      },
      {
        id: 'customers',
        label: 'Customers',
        to: ROUTES.customers.index,
        requiredPermission: 'payments:read',
        matchPrefix: true,
      },
    ],
  },
  {
    // RFC platform-v2 §6: the merchant billing their own customers. Not `Invoices`, which is
    // Payzeno billing the merchant and stays under "Money out".
    id: 'billing',
    label: 'Billing',
    items: [
      {
        id: 'subscriptions',
        label: 'Subscriptions',
        to: ROUTES.billing.subscriptions,
        requiredPermission: 'payments:read',
        matchPrefix: true,
      },
      {
        id: 'prices',
        label: 'Prices',
        to: ROUTES.billing.prices,
        requiredPermission: 'payments:read',
      },
    ],
  },
  {
    id: 'money-out',
    label: 'Money out',
    items: [
      {
        id: 'payouts',
        label: 'Payouts',
        to: ROUTES.payouts.index,
        requiredPermission: 'payouts:read',
        matchPrefix: true,
      },
      {
        id: 'settlements',
        label: 'Settlements',
        to: ROUTES.settlements.index,
        requiredPermission: 'settlements:read',
        flag: 'settlement_explorer',
        matchPrefix: true,
      },
      { id: 'invoices', label: 'Invoices', to: ROUTES.invoices.index, requiredPermission: 'invoices:read' },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    items: [
      {
        id: 'developers',
        label: 'Developers',
        to: ROUTES.developers.index,
        requiredPermission: 'developers:read',
        badgeKey: 'webhooks',
        matchPrefix: true,
      },
      { id: 'settings', label: 'Settings', to: ROUTES.settings.index, requiredPermission: 'settings:read' },
    ],
  },
];

export function SideNav({ badges = {}, collapsed = false, onNavigate }: SideNavProps) {
  const { can } = usePermissions();
  const sections = visibleSections(NAV_SECTIONS, can, isFlagEnabled);

  return (
    <nav
      aria-label="Primary"
      className={pz('side-nav')}
      style={{
        width: collapsed ? '56px' : layout.sideNavWidth,
        flexShrink: 0,
        padding: space[3],
        borderRight: `1px solid ${color.border}`,
        background: color.surfaceMuted,
        fontFamily: font.family,
        overflowY: 'auto',
      }}
    >
      {sections.map((section) => (
        <div key={section.id} style={{ marginBottom: space[5] }}>
          {collapsed ? null : (
            <p
              id={`nav-section-${section.id}`}
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
              {section.label}
            </p>
          )}

          <ul
            aria-labelledby={collapsed ? undefined : `nav-section-${section.id}`}
            aria-label={collapsed ? section.label : undefined}
            style={{ display: 'grid', gap: space[1], margin: 0, padding: 0 }}
          >
            {section.items.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                collapsed={collapsed}
                badgeCount={item.badgeKey ? badges[item.badgeKey] : undefined}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
