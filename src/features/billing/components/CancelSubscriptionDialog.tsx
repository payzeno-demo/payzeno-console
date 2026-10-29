/**
 * Cancel a subscription (RFC platform-v2 §6): at the end of the paid period (default), or now.
 *
 * Neither choice refunds anything. That is said in the dialog, because "cancel" reads as
 * "give the money back" to roughly everyone.
 */
import { useEffect, useState } from 'react';

import type { Subscription } from '@payzeno/contracts';

import { InlineError } from '@components/feedback/InlineError';
import { Button } from '@components/ui/Button';
import { Dialog } from '@components/ui/Dialog';
import { RadioGroup } from '@components/ui/RadioGroup';
import { formatTimestamp } from '@lib/date';

import { useCancelSubscription } from '../useCancelSubscription';

type When = 'period_end' | 'now';

export interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription;
}

export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  subscription,
}: CancelSubscriptionDialogProps) {
  const { cancel, isPending, errorMessage, canceled, reset } = useCancelSubscription();
  const [when, setWhen] = useState<When>(subscription.cancel_at_period_end ? 'now' : 'period_end');

  useEffect(() => {
    if (!open) return;
    reset();
    setWhen(subscription.cancel_at_period_end ? 'now' : 'period_end');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (canceled) onOpenChange(false);
  }, [canceled, onOpenChange]);

  const periodEnd = formatTimestamp(subscription.current_period_end);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Cancel subscription"
      description="Canceling does not refund any payment already taken."
      destructive
      footer={
        <>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Keep subscription
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={isPending}
            onClick={() => cancel(subscription.id, when === 'period_end')}
          >
            {isPending ? 'Canceling…' : when === 'now' ? 'Cancel now' : 'Cancel at period end'}
          </Button>
        </>
      }
    >
      <RadioGroup<When>
        name="cancel-when"
        legend="When should it stop?"
        value={when}
        onValueChange={setWhen}
        options={[
          {
            value: 'period_end',
            label: 'At the end of the current period',
            description: `The customer keeps access until ${periodEnd}. No further renewals.`,
            disabled: subscription.cancel_at_period_end,
          },
          {
            value: 'now',
            label: 'Immediately',
            description: 'Ends today. Any retry of a failed renewal stops too.',
          },
        ]}
      />
      {errorMessage ? (
        <InlineError id="cancel-subscription-error">{errorMessage}</InlineError>
      ) : null}
    </Dialog>
  );
}
