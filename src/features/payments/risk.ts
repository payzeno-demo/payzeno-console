/**
 * Words for RFC platform-v2 §8 risk reviews, shared by the payment detail callout and the
 * reviews table. The rule names are a contract enum; the sentences are ours.
 */
import type { Presentment, ReviewStatus, RiskRule } from '@payzeno/contracts';

export const RISK_RULE_LABELS: Readonly<Record<RiskRule, string>> = {
  high_acquirer_score: 'The card network scored this payment as high risk.',
  very_high_acquirer_score: 'The card network scored this payment as very high risk.',
  country_mismatch: "The card's country differs from where the shopper is.",
  card_velocity: 'This card was tried many times in the last hour.',
  ip_velocity: 'Many different cards were tried from the same network location.',
  amount_spike: 'The amount is much larger than your usual payment.',
  new_merchant_large_amount: 'A large payment on a recently activated account.',
};

export function riskRuleLabel(rule: RiskRule): string {
  return RISK_RULE_LABELS[rule] ?? rule;
}

export const REVIEW_STATUS_LABELS: Readonly<Record<ReviewStatus, string>> = {
  open: 'Held for review',
  approved: 'Approved by Payzeno',
  declined: 'Declined by Payzeno',
};

/**
 * "€19.62 · priced at £16.99 · rate 1.1548" — what the shopper paid, what the merchant priced
 * it at, and the rate between them (§7 adaptive pricing). The rate is the api's decimal string,
 * printed verbatim: the console does no FX arithmetic, same rule as money.
 */
export function presentmentSummary(
  paid: string,
  presentment: Presentment,
  format: (amountMinor: number, currency: Presentment['original_currency']) => string,
): string {
  const priced = format(presentment.original_amount_minor, presentment.original_currency);
  return `${paid} · priced at ${priced} · rate ${presentment.fx_rate}`;
}
