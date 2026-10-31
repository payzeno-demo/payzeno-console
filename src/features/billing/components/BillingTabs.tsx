/**
 * The two Billing pages share a header strip so the section reads as one place. Plain links
 * (it is navigation, not a tab panel), with `aria-current` on the page you are on.
 */
import { NavLink } from 'react-router-dom';

import { ROUTES } from '@/routes';

export function BillingTabs() {
  return (
    <nav aria-label="Billing sections">
      <NavLink to={ROUTES.billing.prices} end>
        Prices
      </NavLink>
      {' · '}
      <NavLink to={ROUTES.billing.subscriptions} end>
        Subscriptions
      </NavLink>
    </nav>
  );
}
