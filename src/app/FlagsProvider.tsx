/**
 * Feature flags, over context.
 *
 * The values are build-time (`lib/flags.ts` reads them once from `config/env.ts`), so this
 * provider does nothing at runtime today. It exists so that the day flags become a service —
 * and there is a ticket for it, PAY-2018, filed by Sagi after the third "can you turn on the
 * settlement explorer for one merchant" request — the call sites do not change. `useFlag()` is
 * already spelled as a hook for exactly that reason.
 *
 * The `overrides` prop is the one runtime path, and it is deliberately restricted to tests and
 * to the developers page's local toggle panel. There is no URL override: a query parameter that
 * flips a flag is a support nightmare and, for `dispute_evidence_v2`, a data-shape change.
 */
import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

import { FLAG_NAMES, allFlags } from '@lib/flags';
import type { FlagName } from '@lib/flags';

export type FlagValues = Readonly<Record<FlagName, boolean>>;

const FlagsContext = createContext<FlagValues | null>(null);

FlagsContext.displayName = 'FlagsContext';

export interface FlagsProviderProps {
  children: ReactNode;
  /** Test-only overrides, merged over the build-time values. */
  overrides?: Partial<Record<FlagName, boolean>>;
}

export function FlagsProvider({ children, overrides }: FlagsProviderProps) {
  const value = useMemo<FlagValues>(() => {
    const base = allFlags();
    if (!overrides) return base;

    const merged: Record<FlagName, boolean> = { ...base };
    for (const name of FLAG_NAMES) {
      const override = overrides[name];
      if (override !== undefined) merged[name] = override;
    }
    return merged;
  }, [overrides]);

  return <FlagsContext.Provider value={value}>{children}</FlagsContext.Provider>;
}

/**
 * Context-aware flag read.
 *
 * Falls back to the build-time value when there is no provider, so a component rendered in
 * isolation (a test, the error boundary's fallback) still gets the right answer instead of
 * throwing.
 */
export function useFlagValue(name: FlagName): boolean {
  const values = useContext(FlagsContext);
  return (values ?? allFlags())[name];
}

/** Every flag, for the developers page's build-info panel. */
export function useAllFlags(): FlagValues {
  return useContext(FlagsContext) ?? allFlags();
}
