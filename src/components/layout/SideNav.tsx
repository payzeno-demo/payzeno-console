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
