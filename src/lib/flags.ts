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
 * The one flag accessor.
 *
 * It is spelled as a hook, and it must be called as one, so that when flags eventually become
 * a context (`FlagsProvider` already exists for it) no call site changes.
 */
export function useFlag(name: FlagName): boolean {
  return FLAG_VALUES[name];
}

/** Non-hook read, for module scope and for the router's lazy-route guard. */
export function isFlagEnabled(name: FlagName): boolean {
  return FLAG_VALUES[name];
}

/** Snapshot of every flag. Rendered in the developers page's build-info panel. */
export function allFlags(): Readonly<Record<FlagName, boolean>> {
  return FLAG_VALUES;
