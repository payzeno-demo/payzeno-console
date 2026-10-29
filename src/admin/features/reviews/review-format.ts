/**
 * Words for the risk signals on a `Review` (RFC platform-v2 §8). Pure functions, so the queue,
 * the detail page and their tests agree on what "country mismatch" means.
 */
import type { Review, RiskRule } from '@payzeno/contracts';

import type { Tone } from '@components/ui/tokens';

export const RULE_LABELS: Readonly<Record<RiskRule, string>> = {
  high_acquirer_score: 'High acquirer risk score',
  very_high_acquirer_score: 'Very high acquirer risk score',
  country_mismatch: 'Card country ≠ shopper country',
  card_velocity: 'Card velocity',
  ip_velocity: 'IP velocity',
  amount_spike: 'Amount spike',
  new_merchant_large_amount: 'Large amount, new merchant',
};

export const RULE_DESCRIPTIONS: Readonly<Record<RiskRule, string>> = {
  high_acquirer_score: 'The acquirer scored this authorisation as risky.',
  very_high_acquirer_score: 'The acquirer scored this authorisation as very risky.',
  country_mismatch: 'The card was issued in a different country from the one the shopper paid from.',
  card_velocity: 'This card was tried many times in the last hour.',
  ip_velocity: 'Many distinct cards were tried from the same shopper location in the last hour.',
  amount_spike: 'Far above this merchant’s average payment.',
  new_merchant_large_amount: 'A large payment on a merchant that has only just gone live.',
};

export function ruleLabel(rule: string): string {
  return (RULE_LABELS as Readonly<Record<string, string>>)[rule] ?? rule;
}

export function ruleDescription(rule: string): string | undefined {
  return (RULE_DESCRIPTIONS as Readonly<Record<string, string>>)[rule];
}

export interface ScoreBand {
  label: string;
  tone: Tone;
}

/** Acquirer risk score, 0–100. The bands are for reading, not for deciding. */
export function scoreBand(score: number): ScoreBand {
  if (score >= 85) return { label: 'Very high', tone: 'danger' };
  if (score >= 65) return { label: 'High', tone: 'warning' };
  if (score >= 40) return { label: 'Elevated', tone: 'info' };
  return { label: 'Low', tone: 'neutral' };
}

/**
 * `true` when both countries are known and differ, `false` when they match, `null` when the
 * shopper's country is unknown (no geo at the edge) — which is its own signal and is shown as
 * such, not as a match.
 */
export function countryMismatch(review: Pick<Review, 'ip_country' | 'card_country'>): boolean | null {
  if (!review.ip_country || !review.card_country) return null;
  return review.ip_country.toUpperCase() !== review.card_country.toUpperCase();
}

export function describeCountries(review: Pick<Review, 'ip_country' | 'card_country'>): string {
  const ip = review.ip_country ?? 'unknown';
  const card = review.card_country ?? 'unknown';
  const mismatch = countryMismatch(review);
  if (mismatch === null) return `Shopper ${ip} · card ${card} — shopper location unknown`;
  return mismatch ? `Shopper ${ip} · card ${card} — mismatch` : `Shopper ${ip} · card ${card} — match`;
}
