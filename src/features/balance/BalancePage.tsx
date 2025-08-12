/**
 * `BalancePage` — the balance index route. No detail route: a balance has no id.
 *
 * The currency selector is URL state, because a merchant taking EUR and USD lives on this
 * page with two tabs open.
 */
import { useNavigate } from 'react-router-dom';

import type { CurrencyCode } from '@payzeno/contracts';

import { ErrorState } from '@components/feedback/ErrorState';
import { UpstreamDown } from '@components/feedback/UpstreamDown';
import { FilterBar } from '@components/data/FilterBar';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { CurrencySelect } from '@components/form/CurrencySelect';
import { UpstreamUnavailableApiError } from '@api/errors';
import { useCurrentMerchant } from '@app/SessionContext';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useMoneyFormat } from '@hooks/useMoneyFormat';
import { usePermissions } from '@hooks/usePermissions';
import { useStringParam } from '@hooks/useQueryParamState';
import { formatTimestamp } from '@lib/date';
import { labelise } from '@lib/format';
import { ROUTES } from '@/routes';

import { BalanceCards } from './components/BalanceCards';
import { NegativeBalanceAlert } from './components/NegativeBalanceAlert';
import { useBalance } from './useBalance';

export function BalancePage() {
  useDocumentTitle('Balance');

  const merchant = useCurrentMerchant();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { formatMinor } = useMoneyFormat();

  const [currency, setCurrency] = useStringParam('currency', merchant.default_currency);
  const { balance, hasNegative, totalHeldMinor, isLoading, isFetching, error, refetch } =
    useBalance(currency as CurrencyCode);

  // A ledger read-through failure is its own screen: the balance is unknown, not zero, and
  // rendering four zeroed cards would be a lie about the merchant's money.
  if (error instanceof UpstreamUnavailableApiError) {
    return (
      <PageContainer as="main">
        <PageHeader title="Balance" />
        <UpstreamDown onRetry={refetch} service="the ledger" />
      </PageContainer>
    );
  }

  return (
    <PageContainer as="main">
      <PageHeader
        title="Balance"
        description={
          balance ? `As of ${formatTimestamp(balance.as_of)}` : 'Your funds, by availability.'
        }
        isBusy={isFetching}
      >
        {can('payouts:write') ? (
          <Button type="button" onClick={() => navigate(ROUTES.payouts.index)}>
            Pay out
          </Button>
        ) : null}
      </PageHeader>

      <FilterBar label="Balance currency">
        <CurrencySelect
          id="balance-currency"
          value={currency as CurrencyCode}
          onChange={(next) => setCurrency(next)}
        />
      </FilterBar>

      {hasNegative && balance ? (
        <NegativeBalanceAlert
          negativeMinor={balance.negative_balance_minor}
          currency={balance.currency}
        />
      ) : null}

      <BalanceCards balance={balance} currency={currency as CurrencyCode} isLoading={isLoading} />

      {error ? <ErrorState error={error} title="We could not load your balance" /> : null}

      {balance ? (
        <Card as="section" aria-label="Balance breakdown by ledger account">
          <h2>Where the money sits</h2>
          <p>
            Available plus pending totals {formatMinor(totalHeldMinor, balance.currency)}. The
            breakdown below is the ledger&apos;s own account view — it is what reconciliation
            works from.
          </p>
          <dl>
            {[...balance._byType.entries()].map(([type, bucket]) => (
              <div key={type}>
                <dt>{labelise(type)}</dt>
                <dd>{formatMinor(bucket.amount_minor, balance.currency)}</dd>
              </div>
            ))}
          </dl>
        </Card>
      ) : null}
    </PageContainer>
  );
}
