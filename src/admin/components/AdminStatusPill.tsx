/**
 * Status pill for the admin-only vocabularies: merchant status, onboarding state, review status,
 * support-task status and severity, email delivery status.
 *
 * Statuses the merchant console already maps (disputes, reconciliation items) use the shared
 * `<StatusPill>` instead, so a `needs_response` dispute is the same red on both apps. This is the
 * same idea for the vocabularies `<StatusPill>` does not know: one table from status to tone,
 * text always rendered, an `srPrefix` so the value is announced with its meaning (ADR 0005 —
 * colour is never the only signal).
 */
import { Badge } from '@components/ui/Badge';
import type { Tone } from '@components/ui/tokens';
import { labelise } from '@lib/format';

export type AdminPillKind =
  | 'merchant'
  | 'onboarding'
  | 'review'
  | 'support'
  | 'severity'
  | 'email';

const TONES: Readonly<Record<AdminPillKind, Readonly<Record<string, Tone>>>> = {
  merchant: {
    pending_review: 'warning',
    active: 'success',
    restricted: 'warning',
    suspended: 'danger',
    rejected: 'danger',
    closed: 'neutral',
  },
  onboarding: {
    collecting: 'neutral',
    submitted: 'info',
    needs_info: 'warning',
    approved: 'success',
    rejected: 'danger',
  },
  review: {
    open: 'warning',
    approved: 'success',
    declined: 'danger',
  },
  support: {
    open: 'warning',
    acknowledged: 'info',
    resolved: 'success',
    dismissed: 'neutral',
  },
  severity: {
    low: 'neutral',
    normal: 'info',
    high: 'warning',
    critical: 'danger',
  },
  email: {
    queued: 'info',
    sent: 'success',
    failed: 'danger',
  },
};

const DEFAULT_PREFIX: Readonly<Record<AdminPillKind, string>> = {
  merchant: 'Merchant status',
  onboarding: 'Onboarding',
  review: 'Review status',
  support: 'Task status',
  severity: 'Severity',
  email: 'Delivery',
};

/** Domain wording where the enum reads badly. */
const LABELS: Readonly<Record<string, string>> = {
  submitted: 'Submitted — awaiting review',
  needs_info: 'Needs info',
  pending_review: 'Pending review',
};

function adminToneFor(kind: AdminPillKind, status: string): Tone {
  return TONES[kind][status] ?? 'neutral';
}

export interface AdminStatusPillProps {
  kind: AdminPillKind;
  status: string;
  srPrefix?: string;
  size?: 'sm' | 'md';
  label?: string;
}

export function AdminStatusPill({ kind, status, srPrefix, size = 'md', label }: AdminStatusPillProps) {
  return (
    <Badge
      tone={adminToneFor(kind, status)}
      size={size}
      srPrefix={srPrefix ?? DEFAULT_PREFIX[kind]}
      withDot
    >
      {label ?? (kind === 'onboarding' || kind === 'merchant' ? LABELS[status] : undefined) ?? labelise(status)}
    </Badge>
  );
}
