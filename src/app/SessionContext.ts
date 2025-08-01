/**
 * The signed-in session, over context.
 *
 * The value is a `ConsoleSession` (`types/session.ts`) — the frozen `SessionResponse` from
 * `GET /v1/auth/me` plus the two things the console adds: a resolved permission set and the
 * livemode toggle position. Neither of those belongs on the wire.
 *
 * `useSessionContext()` deliberately returns `ConsoleSession | null`, because there genuinely
 * is no session on `/login` and every consumer there has to cope. The two convenience hooks
 * below are the opposite: they are for code inside `<RequireSession>`, where the absence of a
 * session is a bug, and they throw.
 */
import { createContext, useContext } from 'react';

import type { Merchant, User } from '@payzeno/contracts';

import { assertDefined } from '@lib/assert';
import type { ConsoleSession } from '@/types/session';

export interface SessionContextValue {
  session: ConsoleSession | null;
  /** Bootstrap is still in flight. Distinguishes "not signed in" from "do not know yet". */
  isLoading: boolean;
  /** Flip the livemode toggle. Persisted only in memory — a reload returns to the default. */
  setLivemode: (livemode: boolean) => void;
  /** Force a re-read of `GET /v1/auth/me`, after a role change or an account switch. */
  refresh: () => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

SessionContext.displayName = 'SessionContext';

/** The raw session, or `null` when nobody is signed in. Safe to call anywhere. */
export function useSessionContext(): ConsoleSession | null {
  return useContext(SessionContext)?.session ?? null;
}

/** The full context value, including the loading flag and the setters. */
export function useSessionState(): SessionContextValue {
  const value = useContext(SessionContext);
  return value ?? { session: null, isLoading: false, setLivemode: () => undefined, refresh: () => undefined };
}

/**
 * The signed-in user.
 * @throws {InvariantViolation} when there is no session — only call inside `<RequireSession>`.
 */
export function useCurrentUser(): User {
  const session = useSessionContext();
  return assertDefined(session?.user, 'useCurrentUser() called without a session');
}

/**
 * The merchant this session acts on.
 * @throws {InvariantViolation} when there is no session.
 */
export function useCurrentMerchant(): Merchant {
  const session = useSessionContext();
  return assertDefined(session?.merchant, 'useCurrentMerchant() called without a session');
}

/** Livemode toggle position. Every list query keys on it. */
export function useLivemode(): boolean {
  return useSessionContext()?._livemode ?? false;
}
