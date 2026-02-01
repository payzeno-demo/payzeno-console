/**
 * The retry button on a settlement item row. Frame 4 of the canonical chain:
 *
 *   router -> SettlementDetailPage -> SettlementItemTable -> RetryItemButton
 *          -> useRetrySettlementItem -> settlements.queries -> SettlementsEndpoint.retryItem
 *          -> ApiClient.post -> ApiClient.request -> fetchTransport
 *
