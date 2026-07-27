/**
 * The retry button on a settlement item row. Frame 4 of the canonical chain:
 *
 *   router -> SettlementDetailPage -> SettlementItemTable -> RetryItemButton
 *          -> useRetrySettlementItem -> settlements.queries -> SettlementsEndpoint.retryItem
 *          -> ApiClient.post -> ApiClient.request -> fetchTransport
 *
 * The "already settling" state is a neutral message, not an error: after PAY-2043 losing the
 * race to the reconciliation sweep is the ordinary outcome.
 */
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';
import { usePermissions } from '@hooks/usePermissions';

import { useRetrySettlementItem } from '../useRetrySettlementItem';

export interface RetryItemButtonProps {
  batchId: string;
  itemId: string;
  disabled?: boolean;
}

export function RetryItemButton({ batchId, itemId, disabled = false }: RetryItemButtonProps) {
  const { retry, isPending, lockedItemId, errorMessage } = useRetrySettlementItem();
  const { can } = usePermissions();

  const allowed = can('settlements:retry');
  const wasLocked = lockedItemId === itemId;

  if (!allowed) {
    return <span title="Retrying an item needs the finance role.">—</span>;
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={disabled || isPending}
        aria-label={`Retry settlement item ${itemId}`}
        onClick={() => retry({ batchId, itemId, reason: 'manual retry from console' })}
      >
        {isPending ? <Spinner size="sm" aria-hidden /> : null}
        Retry
      </Button>

      {wasLocked ? (
        <span role="status" data-tone="neutral">
          Already being settled
        </span>
      ) : null}

      {errorMessage ? (
