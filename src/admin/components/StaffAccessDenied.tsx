/**
 * 403 for staff.
 *
 * The merchant console's `<PermissionDenied>` tells the reader to ask an account owner in
 * Settings → Team, which is the wrong advice for a Payzeno employee. Same shape, staff wording:
 * name the role the page needs and who grants it.
 */
import type { StaffRole } from '@payzeno/contracts';

import { color, font, radius, space } from '@components/ui/tokens';

import { STAFF_ROLE_LABELS, describeRequirement } from '../app/staff-roles';
import type { RoleRequirement } from '../app/staff-roles';

export interface StaffAccessDeniedProps {
  /** What the page or action is, in plain words: "risk reviews". */
  what: string;
  required?: RoleRequirement;
  role?: StaffRole | null;
  requestId?: string;
}

export function StaffAccessDenied({ what, required, role, requestId }: StaffAccessDeniedProps) {
  return (
    <section
      aria-labelledby="staff-access-denied-heading"
      style={{
        display: 'grid',
        gap: space[3],
        maxWidth: '60ch',
        padding: space[6],
        fontFamily: font.family,
        color: color.textPrimary,
        background: color.warningSubtle,
        border: `1px solid ${color.warning}`,
        borderRadius: radius.lg,
      }}
    >
      <h2
        id="staff-access-denied-heading"
        style={{ margin: 0, fontSize: font.size.lg, fontWeight: font.weight.semibold }}
      >
        Your staff role does not include {what}
      </h2>
      <p style={{ margin: 0, color: color.textSecondary }}>
        {required ? `This needs ${describeRequirement(required)}. ` : ''}
        {role ? `You are signed in with the ${STAFF_ROLE_LABELS[role].toLowerCase()} role. ` : ''}
        Staff roles are granted by a Payzeno admin.
      </p>
      {requestId ? (
        <p style={{ margin: 0, fontFamily: font.familyMono, fontSize: font.size.sm, color: color.textMuted }}>
          Reference {requestId}
        </p>
      ) : null}
    </section>
  );
}
