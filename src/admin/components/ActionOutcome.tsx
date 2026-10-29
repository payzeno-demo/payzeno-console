/**
 * The result of the last staff action, on the page, until dismissed.
 *
 * A toast is not enough on its own here: a risk analyst approving a merchant needs to see, after
 * the dialog closes, that it worked and what it triggered ("the owner was emailed"), and a bot
 * driving the page needs something that does not vanish after five seconds. Every mutation hook
 * in the admin app returns an `ActionOutcome`; every page renders it with this.
 */
import { Alert } from '@components/ui/Alert';
import { space } from '@components/ui/tokens';

export interface ActionOutcome {
  tone: 'success' | 'info' | 'danger';
  title: string;
  body?: string;
}

export function ActionOutcomeAlert({
  outcome,
  onDismiss,
}: {
  outcome: ActionOutcome | null;
  onDismiss?: () => void;
}) {
  if (!outcome) return null;
  return (
    <div data-testid="action-outcome" style={{ marginBottom: space[4] }}>
      <Alert
        tone={outcome.tone}
        role={outcome.tone === 'danger' ? 'alert' : 'status'}
        title={outcome.title}
        onDismiss={onDismiss}
      >
        {outcome.body}
      </Alert>
    </div>
  );
}
