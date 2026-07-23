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

import { pz } from '@lib/cn';
import { maskLastFour } from '@lib/format';

import { color, font, space } from '../ui/tokens';

export interface CardBrandCellProps {
  brand: CardBrand;
  lastFour: string;
  /** Rendered as a muted suffix — "debit", "prepaid". Interchange differs wildly by funding. */
  funding?: CardFunding;
  /** Issuer country, ISO-3166-1 alpha-2. Shown as a muted suffix on the charge detail page. */
  country?: string | null;
}

/** Display names. `mastercard` is one word and lowercase in their own brand guide; we title it. */
const BRAND_LABELS: Readonly<Record<CardBrand, string>> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
};

/**
 * A monochrome glyph per brand. Deliberately not the network logos: shipping the real marks
 * means a licensing review, and legal said no twice (PAY-1490).
 */
const BRAND_GLYPHS: Readonly<Record<CardBrand, string>> = {
  visa: '▮',
  mastercard: '◎',
  amex: '▤',
  discover: '◇',
};

export function brandLabel(brand: CardBrand): string {
  return BRAND_LABELS[brand];
}

export function CardBrandCell({ brand, lastFour, funding, country }: CardBrandCellProps) {
  const suffixes: string[] = [];
  if (funding && funding !== 'unknown') suffixes.push(funding);
  if (country) suffixes.push(country);

  return (
    <span
      className={pz('card-brand-cell')}
      style={{ display: 'inline-flex', alignItems: 'center', gap: space[2] }}
    >
      <span aria-hidden="true" style={{ color: color.textMuted }}>
        {BRAND_GLYPHS[brand]}
      </span>

      <span style={{ fontSize: font.size.md, color: color.textPrimary }}>
        {BRAND_LABELS[brand]} {maskLastFour(lastFour)}
      </span>
