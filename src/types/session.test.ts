/**
 * `toConsoleSession` — the livemode default for a merchant that has never been activated
 * (RFC platform-v2 §3).
 */
import { describe, expect, it } from 'vitest';

import { makeMerchant, makeSession } from '@/test/factories';
import { isNotYetActivated, toConsoleSession } from '@/types/session';

describe('the livemode default', () => {
  it('follows the merchant for an active account', () => {
    const session = toConsoleSession(makeSession({ merchant: makeMerchant({ livemode: true }) }));

    expect(session._livemode).toBe(true);
  });

  it('starts a merchant awaiting review in test mode, whatever the merchant row says', () => {
    const session = toConsoleSession(
      makeSession({ merchant: makeMerchant({ status: 'pending_review', livemode: true }) }),
    );

    expect(session._livemode).toBe(false);
  });

  it('leaves a restricted merchant on its live data — it was active once', () => {
    const session = toConsoleSession(
      makeSession({ merchant: makeMerchant({ status: 'restricted', livemode: true }) }),
    );

    expect(session._livemode).toBe(true);
  });

  it('honours an explicit toggle position', () => {
    const session = toConsoleSession(
      makeSession({ merchant: makeMerchant({ status: 'pending_review' }) }),
      true,
    );

    expect(session._livemode).toBe(true);
  });
});

describe('isNotYetActivated', () => {
  it('is true for pending_review and rejected only', () => {
    expect(isNotYetActivated({ status: 'pending_review' })).toBe(true);
    expect(isNotYetActivated({ status: 'rejected' })).toBe(true);
    expect(isNotYetActivated({ status: 'active' })).toBe(false);
    expect(isNotYetActivated({ status: 'suspended' })).toBe(false);
  });
});
