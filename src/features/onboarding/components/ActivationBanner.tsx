/**
 * "Test mode only until we verify your business" — the app-wide strip for a merchant that has
 * never been activated (RFC platform-v2 §3). Mounted once, by `App.tsx`, above every route.
 *
 * Reads the session only (no request): the merchant's status is on `GET /v1/auth/me`, which is
 * re-read after an onboarding submit.
 */
import { Link } from 'react-router-dom';

import { useSessionContext } from '@app/SessionContext';
import { Alert } from '@components/ui/Alert';
import { ROUTES } from '@/routes';
import { isNotYetActivated } from '@/types/session';

import { TEST_MODE_ONLY } from '../onboarding.copy';

export function ActivationBanner() {
  const session = useSessionContext();
  const merchant = session?.merchant;

  if (!merchant || !isNotYetActivated(merchant)) return null;

  if (merchant.status === 'rejected') {
    return (
      <Alert tone="danger" role="status" title="Live payments are unavailable">
        <p>
          We could not verify your business, so this account stays in test mode.{' '}
          <Link to={ROUTES.onboarding.index}>See why</Link>
        </p>
      </Alert>
    );
  }

  return (
    <Alert tone="warning" title={TEST_MODE_ONLY}>
      <p>
        Live payments are refused until Payzeno has reviewed your business. Test mode works now.{' '}
        <Link to={ROUTES.onboarding.index}>Finish setting up</Link>
      </p>
    </Alert>
  );
}
