/**
 * Renders `payment_intent.next_action` — set exactly when `status === 'requires_action'`.
 *
 * Under PSD2 an EUR or GBP e-commerce authorisation without SCA (or a documented exemption)
 * is declined by the issuer, so `requires_action` is a routine state, not an error. The
 * merchant's own checkout page handles the redirect; the console's job is to explain to
 * whoever is staring at a stuck payment why it is stuck.
 */
import type { NextAction } from '@payzeno/contracts';

import { Alert } from '@components/ui/Alert';
import { useCopyToClipboard } from '@hooks/useCopyToClipboard';

export interface NextActionCalloutProps {
  nextAction: NextAction | null;
  paymentIntentId: string;
}

export function NextActionCallout({ nextAction, paymentIntentId }: NextActionCalloutProps) {
  const { copy, copied } = useCopyToClipboard();

  if (!nextAction) return null;

  if (nextAction.type === 'redirect_to_url') {
    return (
      <Alert tone="info" title="Waiting for the customer to authenticate">
        <p>
          The issuer asked for 3-D Secure. The customer has to complete the challenge on your
          checkout page before this payment can be authorised.
        </p>
        {nextAction.url ? (
          <button type="button" onClick={() => copy(nextAction.url ?? '')}>
            {copied ? 'Copied' : 'Copy authentication URL'}
          </button>
        ) : null}
      </Alert>
    );
  }

  return (
    <Alert tone="info" title="Waiting on the mobile SDK">
      <p>
        Your app needs to hand this payment to the Payzeno SDK to finish authentication.
        Payment intent <code>{paymentIntentId}</code>.
      </p>
      {nextAction.sdk_payload ? (
        <p>
          SDK payload keys: {Object.keys(nextAction.sdk_payload).join(', ')}. The values are
          deliberately not shown here.
        </p>
      ) : null}
    </Alert>
  );
}
