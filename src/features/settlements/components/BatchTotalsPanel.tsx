/**
 * Added by PAY-2043 (the-incident.md §8): surfaces posted vs expected on the settlement
 * detail page.
 *
 * The batch object the console receives is a `MerchantSettlementBatch` and deliberately does
 * **not** carry `expected_total_minor` / `posted_total_minor` — those are acquirer-level and
 * would expose every other merchant in the file. So the panel rolls the merchant's own items
