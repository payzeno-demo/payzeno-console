/**
 * Card brand + last four, in a table cell.
 *
 * arc PCI: the last four digits are the **only** card data that exists in this repo. There is
 * no PAN, no BIN, no expiry rendering helper, and there never will be — the console reads
 * `Charge.card`, which is a `CardSummary` (contracts), and `CardSummary` has already been
 * stripped by payzeno-api. If you find yourself wanting a `cardNumber` prop here, read ADR
 * 0003 first.
 *
 * a11y: the brand mark is a glyph, so it carries an `aria-hidden` and the brand name is in the
 * text. "•••• 4242" alone reads as "4242" to a screen reader, which is not enough to tell two
 * cards apart.
 */
import type { CardBrand, CardFunding } from '@payzeno/contracts';
