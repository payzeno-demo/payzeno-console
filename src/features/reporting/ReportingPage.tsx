/**
 * `ReportingPage` — the dashboard. The route merchants land on after signing in.
 *
 * Three hooks, three routes, one window control. The window drives all of them, which is why
 * `intervalFor` lives in `useVolumeTimeseries` rather than being chosen per chart: two charts
 * on different intervals side by side is how you make a merchant think their volume doubled.
 */
import { REPORTING_WINDOWS } from '@payzeno/contracts';
import type { CurrencyCode, ReportingWindow } from '@payzeno/contracts';

import { LineChart } from '@components/charts/LineChart';
import { FilterBar } from '@components/data/FilterBar';
import { ErrorState } from '@components/feedback/ErrorState';
import { PageContainer } from '@components/layout/PageContainer';
import { PageHeader } from '@components/layout/PageHeader';
import { Alert } from '@components/ui/Alert';
import { Card } from '@components/ui/Card';
import { Select } from '@components/ui/Select';
import { CurrencySelect } from '@components/form/CurrencySelect';
import { useCurrentMerchant } from '@app/SessionContext';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useEnumParam, useStringParam } from '@hooks/useQueryParamState';
import { useMoneyFormat } from '@hooks/useMoneyFormat';
import { OnboardingChecklist } from '@features/onboarding/components/OnboardingChecklist';

import { SummaryCards } from './components/SummaryCards';
import { VolumeChart } from './components/VolumeChart';
import { useBalanceHistory } from './useBalanceHistory';
import { useDashboardSummary } from './useDashboardSummary';
import { useVolumeTimeseries } from './useVolumeTimeseries';

const WINDOW_LABELS: Readonly<Record<ReportingWindow, string>> = {
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
};

export function ReportingPage() {
  useDocumentTitle('Dashboard');

  const merchant = useCurrentMerchant();
  const { formatMinor } = useMoneyFormat();

  const [window, setWindow] = useEnumParam<ReportingWindow>('window', REPORTING_WINDOWS, '7d');
  const [currency, setCurrency] = useStringParam('currency', merchant.default_currency);
  const activeWindow = window ?? '7d';
  const activeCurrency = currency as CurrencyCode;

  const summary = useDashboardSummary(activeWindow, activeCurrency);
  const volume = useVolumeTimeseries(activeWindow, activeCurrency);
  const balanceHistory = useBalanceHistory(activeWindow, activeCurrency);

  return (
    <PageContainer as="main">
      <PageHeader
        title={`Hello, ${merchant.display_name}`}
        description={WINDOW_LABELS[activeWindow]}
        isBusy={summary.isFetching}
      />

      {/* RFC platform-v2 §3: until Payzeno approves the business, Home leads with setup. */}
      {merchant.status === 'pending_review' ? <OnboardingChecklist /> : null}

      {summary.isDegraded ? (
        <Alert tone="warning" title="Reporting is degraded" role="status">
          One of the systems behind these figures is not responding, so some numbers may be
          missing or stale. Your payments, balance and payouts are unaffected.
        </Alert>
      ) : null}

      <FilterBar label="Reporting window">
        <Select
          id="reporting-window"
          label="Window"
          value={activeWindow}
          onValueChange={(next) => setWindow(next as ReportingWindow)}
          options={REPORTING_WINDOWS.map((value) => ({
            value,
            label: WINDOW_LABELS[value],
          }))}
        />
        <CurrencySelect
          id="reporting-currency"
          value={activeCurrency}
          onChange={(next) => setCurrency(next)}
        />
      </FilterBar>

      <SummaryCards
        tiles={summary.tiles}
        currency={summary.currency}
        successRatio={summary.successRatio}
        refundRatio={summary.refundRatio}
        isLoading={summary.isLoading}
      />

      {summary.error && !summary.isDegraded ? (
        <ErrorState error={summary.error} title="We could not load your summary" />
      ) : null}

      <VolumeChart
        points={volume.points}
        peak={volume.peak}
        interval={volume.interval}
        currency={activeCurrency}
        isLoading={volume.isLoading}
      />

      {volume.error ? (
        <ErrorState error={volume.error} title="The volume chart is unavailable" />
      ) : null}

      <Card as="section" aria-labelledby="balance-history-heading">
        <h2 id="balance-history-heading">Balance over time</h2>

        {balanceHistory.error ? (
          <p>
            The ledger did not answer in time. This chart is the slowest read in the console —
            try a shorter window.
          </p>
        ) : (
          <>
            {/* Major-unit points, so no `currency` prop — see `VolumeChart`. */}
            <LineChart
              data={balanceHistory.points}
              xKey="bucket"
              series={[{ dataKey: 'value', name: `Available balance (${activeCurrency})` }]}
              title="Available balance over time"
            />
            <p>
              Available now: {formatMinor(summary.availableMinor, activeCurrency)}
              {balanceHistory.delta !== null
                ? `, ${balanceHistory.delta >= 0 ? 'up' : 'down'} across this window.`
                : '.'}
            </p>
          </>
        )}
      </Card>
    </PageContainer>
  );
}
