/**
 * `usePermissions`.
 *
 * The console's authorisation model in one hook. It is advisory — payzeno-api enforces the real
 * thing and answers 403 — but it is what decides whether a merchant sees a button that will
 * fail, which is the difference between a usable console and an infuriating one.
 */
import { describe, expect, it } from 'vitest';

import { useCan, usePermissions } from '@hooks/usePermissions';
import { makeConsoleSession, makeSession, makeUser } from '@/test/factories';
import { toConsoleSession } from '@/types/session';
import { renderHookWithProviders } from '@/test/render';

function permissionsFor(session: ReturnType<typeof makeConsoleSession> | null) {
  return renderHookWithProviders(() => usePermissions(), { session }).result;
}

describe('as an owner', () => {
  it('grants everything the session lists', () => {
    const result = permissionsFor(makeConsoleSession());

    expect(result.current.can('settlements:retry')).toBe(true);
    expect(result.current.can('payouts:write')).toBe(true);
    expect(result.current.can('team:invite')).toBe(true);
  });

  it('is not read-only', () => {
    expect(permissionsFor(makeConsoleSession()).current.readOnly).toBe(false);
  });

  it('exposes the granted list', () => {
    const result = permissionsFor(makeConsoleSession());

    expect(result.current.granted).toContain('disputes:write');
    expect(result.current.granted.length).toBeGreaterThan(10);
  });
});

describe('as a viewer', () => {
  const viewer = toConsoleSession(
    makeSession({ user: makeUser({ role: 'viewer' }), permissions: ['payments:read'] }),
  );

  it('grants only what the session lists', () => {
    const result = permissionsFor(viewer);

    expect(result.current.can('payments:read')).toBe(true);
    expect(result.current.can('payouts:write')).toBe(false);
    expect(result.current.can('settlements:retry')).toBe(false);
  });

  it('is read-only', () => {
    expect(permissionsFor(viewer).current.readOnly).toBe(true);
  });
});

describe('with no session', () => {
  it('grants nothing', () => {
    const result = permissionsFor(null);

    expect(result.current.can('payments:read')).toBe(false);
    expect(result.current.granted).toEqual([]);
  });

  it('reports read-only rather than throwing', () => {
    expect(permissionsFor(null).current.readOnly).toBe(true);
  });
});

describe('canAny', () => {
  const partial = toConsoleSession(
    makeSession({ permissions: ['payouts:read', 'invoices:read'] }),
  );

  it('is true when at least one is granted', () => {
    expect(permissionsFor(partial).current.canAny(['payouts:write', 'payouts:read'])).toBe(true);
  });

  it('is false when none is granted', () => {
    expect(
      permissionsFor(partial).current.canAny(['payouts:write', 'settlements:retry']),
    ).toBe(false);
  });

  it('is false for an empty list', () => {
    expect(permissionsFor(partial).current.canAny([])).toBe(false);
  });
});

describe('canAll', () => {
  const partial = toConsoleSession(
    makeSession({ permissions: ['payouts:read', 'invoices:read'] }),
  );

  it('is true only when every one is granted', () => {
    expect(permissionsFor(partial).current.canAll(['payouts:read', 'invoices:read'])).toBe(true);
  });

  it('is false when one is missing', () => {
    expect(permissionsFor(partial).current.canAll(['payouts:read', 'payouts:write'])).toBe(false);
  });

  it('is vacuously true for an empty list', () => {
    expect(permissionsFor(partial).current.canAll([])).toBe(true);
  });
});

describe('useCan', () => {
  it('is the single-permission shorthand', () => {
    const { result } = renderHookWithProviders(() => useCan('settlements:retry'), {
      session: makeConsoleSession(),
    });

    expect(result.current).toBe(true);
  });

  it('is false for a permission the session does not hold', () => {
    const { result } = renderHookWithProviders(() => useCan('settlements:retry'), {
      session: toConsoleSession(makeSession({ permissions: ['payments:read'] })),
    });

    expect(result.current).toBe(false);
  });
});

describe('stability', () => {
  it('returns a stable object while the session does not change', () => {
    const { result, rerender } = renderHookWithProviders(() => usePermissions());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
