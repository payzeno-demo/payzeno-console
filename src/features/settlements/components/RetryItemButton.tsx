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
