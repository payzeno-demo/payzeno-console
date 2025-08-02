/**
 * Card brand + last four, in a table cell.
 *
 * arc PCI: the last four digits are the **only** card data that exists in this repo. There is
 * no PAN, no BIN, no expiry rendering helper, and there never will be — the console reads
 * `Charge.card`, which is a `CardSummary` (contracts), and `CardSummary` has already been
 * stripped by payzeno-api. If you find yourself wanting a `cardNumber` prop here, read ADR
