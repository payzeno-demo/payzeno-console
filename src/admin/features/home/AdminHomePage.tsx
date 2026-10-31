/**
 * `AdminHomePage` — `/` on the admin host. What is waiting for a person, per queue the signed-in
 * role can open: KYC applications awaiting a decision, open risk reviews, disputes needing a
 * response, the settlement backlog, open support tasks. Each tile links to its queue, filtered.
 */
import { Link } from 'react-router-dom';

import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { color, font, radius, space } from '@components/ui/tokens';
import { useDocumentTitle } from '@hooks/useDocumentTitle';

import { ADMIN_ROUTES } from '../../adminRoutes';
import { STAFF_ROLE_LABELS } from '../../app/staff-roles';
import { useCurrentStaff } from '../../app/StaffSessionContext';

import { useAdminOverview } from './useAdminOverview';
import type { OverviewCount } from './useAdminOverview';

interface TileSpec {
  id: string;
  label: string;
  hint: string;
  to: string;
  linkLabel: string;
  count: OverviewCount;
}

function formatCount(count: OverviewCount): string {
  if (count.error) return 'Unavailable';
  if (count.value === null) return '…';
  return count.atLeast ? `${count.value}+` : count.value.toLocaleString();
}

export function AdminHomePage() {
  useDocumentTitle('Overview', 'Admin');
  const staff = useCurrentStaff();
  const overview = useAdminOverview();

  const tiles: TileSpec[] = [
    {
      id: 'pending-kyc',
      label: 'Pending KYC',
      hint: 'Onboarding applications submitted and waiting for a decision',
      to: `${ADMIN_ROUTES.merchants.index}?onboarding_state=submitted`,
      linkLabel: 'Review applications',
      count: overview.pendingKyc,
    },
    {
      id: 'open-reviews',
      label: 'Open risk reviews',
      hint: 'Payments held by a risk rule; the shopper is waiting',
      to: ADMIN_ROUTES.reviews.index,
      linkLabel: 'Open the review queue',
      count: overview.openReviews,
    },
    {
      id: 'disputes-needing-response',
      label: 'Disputes needing response',
      hint: 'Across every merchant, before the evidence deadline',
      to: `${ADMIN_ROUTES.disputes.index}?status=needs_response`,
      linkLabel: 'See disputes',
      count: overview.disputesNeedingResponse,
    },
    {
      id: 'settlement-backlog',
      label: 'Settlement backlog',
      hint: 'Reconciliation items not yet settled',
      to: ADMIN_ROUTES.settlements.index,
      linkLabel: 'See the backlog',
      count: overview.settlementBacklog,
    },
    {
      id: 'open-support-tasks',
      label: 'Open support tasks',
      hint: 'Work the platform opened for a person',
      to: ADMIN_ROUTES.support.index,
      linkLabel: 'Open the task list',
      count: overview.openSupportTasks,
    },
  ].filter((tile) => tile.count.visible);

  return (
    <PageContainer as="main">
      <PageHeader
        title="Overview"
        description={`Signed in as ${staff.full_name} (${STAFF_ROLE_LABELS[staff.role]}). What is waiting for a person right now.`}
      />

      <ul
        aria-label="Queues"
        style={{
          display: 'grid',
          gap: space[4],
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          margin: 0,
          padding: 0,
          listStyle: 'none',
        }}
      >
        {tiles.map((tile) => (
          <li
            key={tile.id}
            data-testid={`overview-${tile.id}`}
            aria-busy={tile.count.isLoading || undefined}
            style={{
              display: 'grid',
              gap: space[2],
              padding: space[5],
              background: color.surface,
              border: `1px solid ${color.border}`,
              borderRadius: radius.lg,
            }}
          >
            <h2 style={{ margin: 0, fontSize: font.size.md, fontWeight: font.weight.medium, color: color.textSecondary }}>
              {tile.label}
            </h2>
            <p
              style={{
                margin: 0,
                fontFamily: font.familyMono,
                fontSize: font.size.xxl,
                fontWeight: font.weight.semibold,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatCount(tile.count)}
            </p>
            <p style={{ margin: 0, fontSize: font.size.sm, color: color.textMuted }}>{tile.hint}</p>
            <Link to={tile.to} style={{ color: color.textLink, fontSize: font.size.sm }}>
              {tile.linkLabel}
            </Link>
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}
