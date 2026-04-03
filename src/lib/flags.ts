/**
 * Feature flags.
 *
 * Build-time only. There is no flag service, no network call and no runtime override: a flag
 * is a `VITE_FEATURE_*` variable baked into the bundle, read once through `config/env.ts`.
 * Changing one means a rebuild.
 *
 * Exactly two flags exist. Adding a third means adding an eighth env var, which ADR 0002 says
 * is a conversation and not a PR.
 */
import { env } from '@config/env';

export const FLAG_NAMES = ['settlement_explorer', 'dispute_evidence_v2'] as const;
export type FlagName = (typeof FLAG_NAMES)[number];

/** The resolved values. Frozen so a debugging session cannot accidentally flip one. */
const FLAG_VALUES: Readonly<Record<FlagName, boolean>> = Object.freeze({
  settlement_explorer: env.featureSettlementExplorer,
  dispute_evidence_v2: env.featureDisputeEvidenceV2,
});

/**
