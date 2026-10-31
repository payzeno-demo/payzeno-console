/**
 * The action bar on a merchant's detail page: approve / reject / request info (onboarding) and
 * restrict / reactivate (status). Each opens a `ConfirmActionDialog`; nothing fires on one click.
 *
 * Availability follows the api's state machines so a button is only live when the request can
 * succeed. An unavailable action is rendered disabled *with its reason* (wired with
 * `aria-describedby`), not hidden — staff need to know why "Approve" is grey.
 */
import type { AdminMerchantDetail } from '@payzeno/contracts';
import { useState } from 'react';
import type { CSSProperties } from 'react';

import { Button } from '@components/ui/Button';
import { color, font, space, visuallyHidden } from '@components/ui/tokens';
import { labelise } from '@lib/format';

import { ACTION_ROLES, describeRequirement } from '../../../app/staff-roles';
import { useStaffPermissions } from '../../../app/StaffSessionContext';
import { ConfirmActionDialog } from '../../../components/ConfirmActionDialog';
import type { StaffActionResult } from '../../../hooks/useStaffAction';
import type { MerchantDecisionInput, MerchantStatusInput } from '../merchants.queries';

type DialogKind = 'approve' | 'reject' | 'request-info' | 'restrict' | 'reactivate';

export interface MerchantActionsProps {
  detail: AdminMerchantDetail;
  decision: StaffActionResult<MerchantDecisionInput>;
  status: StaffActionResult<MerchantStatusInput>;
}

interface Availability {
  enabled: boolean;
  reason: string | null;
}

function actionAvailability(
  detail: AdminMerchantDetail,
  canAct: boolean,
): Record<DialogKind, Availability> {
  const roleReason = canAct ? null : `Needs ${describeRequirement(ACTION_ROLES['merchants:decide'])}.`;
  const state = detail.onboarding.state;
  const merchantStatus = detail.merchant.status;

  const gate = (allowed: boolean, why: string): Availability =>
    roleReason
      ? { enabled: false, reason: roleReason }
      : allowed
        ? { enabled: true, reason: null }
        : { enabled: false, reason: why };

  const stateLabel = labelise(state).toLowerCase();
  const statusLabel = labelise(merchantStatus).toLowerCase();

  return {
    approve: gate(state === 'submitted', `Only a submitted application can be approved; this one is ${stateLabel}.`),
    'request-info': gate(
      state === 'submitted',
      `Information can only be requested on a submitted application; this one is ${stateLabel}.`,
    ),
    reject: gate(
      state === 'submitted' || state === 'needs_info',
      `Only an application under review can be rejected; this one is ${stateLabel}.`,
    ),
    restrict: gate(merchantStatus === 'active', `Only an active merchant can be restricted; this one is ${statusLabel}.`),
    reactivate: gate(
      (merchantStatus === 'restricted' || merchantStatus === 'suspended') && state === 'approved',
      `Only a restricted or suspended merchant with an approved application can be reactivated; this one is ${statusLabel}.`,
    ),
  };
}

const LABELS: Readonly<Record<DialogKind, string>> = {
  approve: 'Approve onboarding',
  'request-info': 'Request more information',
  reject: 'Reject onboarding',
  restrict: 'Restrict merchant',
  reactivate: 'Reactivate merchant',
};

export function MerchantActions({ detail, decision, status }: MerchantActionsProps) {
  const { can } = useStaffPermissions();
  const [open, setOpen] = useState<DialogKind | null>(null);

  const availability = actionAvailability(detail, can('merchants:decide'));
  const name = detail.merchant.display_name;
  const merchantId = detail.merchant.id;

  const close = () => {
    setOpen(null);
    decision.reset();
    status.reset();
  };

  const button = (kind: DialogKind, variant: 'primary' | 'secondary' | 'danger') => {
    const state = availability[kind];
    const reasonId = `merchant-action-${kind}-reason`;
    return (
      <span key={kind} style={{ display: 'inline-flex' }}>
        <Button
          variant={variant}
          disabled={!state.enabled}
          aria-describedby={state.reason ? reasonId : undefined}
          title={state.reason ?? undefined}
          onClick={() => setOpen(kind)}
        >
          {LABELS[kind]}
        </Button>
        {state.reason ? (
          <span id={reasonId} style={visuallyHidden as CSSProperties}>
            {state.reason}
          </span>
        ) : null}
      </span>
    );
  };

  const firstReason =
    availability.approve.reason && !can('merchants:decide') ? availability.approve.reason : null;

  return (
    <section aria-label="Merchant actions" style={{ display: 'grid', gap: space[2] }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: space[2] }}>
        {button('approve', 'primary')}
        {button('request-info', 'secondary')}
        {button('reject', 'danger')}
        <span aria-hidden="true" style={{ width: space[4] }} />
        {button('restrict', 'secondary')}
        {button('reactivate', 'secondary')}
      </div>
      {firstReason ? (
        <p style={{ margin: 0, fontSize: font.size.sm, color: color.textSecondary }}>
          You can review this merchant but not act on it. {firstReason}
        </p>
      ) : null}

      <ConfirmActionDialog
        open={open === 'approve'}
        onOpenChange={(next) => (next ? setOpen('approve') : close())}
        title={`Approve ${name}?`}
        description="The merchant becomes active and can take live payments straight away. The owner is emailed that they are approved."
        confirmLabel="Approve onboarding"
        isPending={decision.isPending}
        errorMessage={decision.errorMessage}
        onConfirm={() => decision.run({ merchantId, decision: 'approve' }, { onSuccess: close })}
      />

      <ConfirmActionDialog
        open={open === 'request-info'}
        onOpenChange={(next) => (next ? setOpen('request-info') : close())}
        title={`Request more information from ${name}`}
        description="The application goes back to the merchant. Your message is shown to them in the console and emailed to the owner, word for word."
        confirmLabel="Send request"
        note={{
          id: 'merchant-request-info-message',
          label: 'Message to the merchant',
          hint: 'Say exactly what is missing and how to provide it.',
          required: true,
          requiredMessage: 'Write the message the merchant will receive.',
          maxLength: 2000,
        }}
        isPending={decision.isPending}
        errorMessage={decision.errorMessage}
        onConfirm={(message) =>
          decision.run({ merchantId, decision: 'request-info', message }, { onSuccess: close })
        }
      />

      <ConfirmActionDialog
        open={open === 'reject'}
        onOpenChange={(next) => (next ? setOpen('reject') : close())}
        title={`Reject ${name}?`}
        description="The merchant is rejected and cannot take live payments. Your message is emailed to the owner, word for word. This cannot be undone from the back office."
        confirmLabel="Reject onboarding"
        confirmVariant="danger"
        note={{
          id: 'merchant-reject-message',
          label: 'Message to the merchant',
          hint: 'The reason they will read. Keep internal detail out of it.',
          required: true,
          requiredMessage: 'Write the message the merchant will receive.',
          maxLength: 2000,
        }}
        isPending={decision.isPending}
        errorMessage={decision.errorMessage}
        onConfirm={(message) =>
          decision.run({ merchantId, decision: 'reject', message }, { onSuccess: close })
        }
      />

      <ConfirmActionDialog
        open={open === 'restrict'}
        onOpenChange={(next) => (next ? setOpen('restrict') : close())}
        title={`Restrict ${name}?`}
        description="Live payments and payouts stop until the merchant is reactivated. The reason goes in the staff audit log; the merchant does not see it."
        confirmLabel="Restrict merchant"
        confirmVariant="danger"
        note={{
          id: 'merchant-restrict-reason',
          label: 'Reason',
          hint: 'For the audit log — a ticket number and a sentence.',
          required: true,
          requiredMessage: 'Give a reason for the audit log.',
          minLength: 3,
          maxLength: 500,
        }}
        isPending={status.isPending}
        errorMessage={status.errorMessage}
        onConfirm={(reason) =>
          status.run({ merchantId, status: 'restricted', reason }, { onSuccess: close })
        }
      />

      <ConfirmActionDialog
        open={open === 'reactivate'}
        onOpenChange={(next) => (next ? setOpen('reactivate') : close())}
        title={`Reactivate ${name}?`}
        description="The merchant returns to active and can take live payments again. The reason goes in the staff audit log."
        confirmLabel="Reactivate merchant"
        note={{
          id: 'merchant-reactivate-reason',
          label: 'Reason',
          hint: 'For the audit log — what changed since the restriction.',
          required: true,
          requiredMessage: 'Give a reason for the audit log.',
          minLength: 3,
          maxLength: 500,
        }}
        isPending={status.isPending}
        errorMessage={status.errorMessage}
        onConfirm={(reason) =>
          status.run({ merchantId, status: 'active', reason }, { onSuccess: close })
        }
      />
    </section>
  );
}
