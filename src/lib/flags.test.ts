/**
 * `lib/flags.ts`.
 *
 * Exactly two flags, both build-time, both read from `config/env.ts` and frozen at module load
 * (blueprint §8, §10). There is no flag service, no network call and no runtime toggle: a flag
 * that can change while the app is running is a flag that will change halfway through a
 * settlement retry.
 *
 * `src/test/setup.ts` sets `VITE_FEATURE_SETTLEMENT_EXPLORER=true` and
 * `VITE_FEATURE_DISPUTE_EVIDENCE_V2=false`, which is the local-development configuration, so
 * the values below are the ones a developer sees.
 */
import { describe, expect, it } from 'vitest';

import { FLAG_NAMES, allFlags, isFlagEnabled, isFlagName, useFlag } from '@lib/flags';
import { env } from '@config/env';
import { renderHookWithProviders } from '@/test/render';

describe('the flag set', () => {
  it('has exactly two flags', () => {
    expect(FLAG_NAMES).toEqual(['settlement_explorer', 'dispute_evidence_v2']);
  });

  it('exposes both through allFlags', () => {
    expect(Object.keys(allFlags()).sort()).toEqual(
      ['dispute_evidence_v2', 'settlement_explorer'].sort(),
    );
  });

  it('is frozen — nothing may flip a flag at runtime', () => {
    expect(Object.isFrozen(allFlags())).toBe(true);
  });

  it('returns the same object every time, so no consumer can mutate a copy', () => {
    expect(allFlags()).toBe(allFlags());
  });
});

describe('the values come from the env module', () => {
  it('mirrors env.featureSettlementExplorer', () => {
    expect(isFlagEnabled('settlement_explorer')).toBe(env.featureSettlementExplorer);
  });

  it('mirrors env.featureDisputeEvidenceV2', () => {
    expect(isFlagEnabled('dispute_evidence_v2')).toBe(env.featureDisputeEvidenceV2);
  });

  it('reflects the local-development configuration', () => {
    expect(isFlagEnabled('settlement_explorer')).toBe(true);
    expect(isFlagEnabled('dispute_evidence_v2')).toBe(false);
  });
});

describe('useFlag', () => {
  it('returns the same value as isFlagEnabled', () => {
    const { result } = renderHookWithProviders(() => useFlag('settlement_explorer'));

    expect(result.current).toBe(isFlagEnabled('settlement_explorer'));
  });

  it('returns false for the off flag', () => {
    const { result } = renderHookWithProviders(() => useFlag('dispute_evidence_v2'));

    expect(result.current).toBe(false);
  });

  it('does not change across renders — a build-time flag is constant for the session', () => {
    const { result, rerender } = renderHookWithProviders(() => useFlag('settlement_explorer'));
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});

describe('isFlagName', () => {
  it('accepts the two real names', () => {
    expect(isFlagName('settlement_explorer')).toBe(true);
    expect(isFlagName('dispute_evidence_v2')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isFlagName('settlements_explorer')).toBe(false);
    expect(isFlagName('')).toBe(false);
    expect(isFlagName('DISPUTE_EVIDENCE_V2')).toBe(false);
  });
});
