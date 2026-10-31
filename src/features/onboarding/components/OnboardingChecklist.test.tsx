/**
 * The Home checklist and the app-wide activation banner (RFC platform-v2 §3).
 */
import { HttpResponse, http } from 'msw';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { ActivationBanner } from '@features/onboarding/components/ActivationBanner';
import { OnboardingChecklist } from '@features/onboarding/components/OnboardingChecklist';
import { ReportingPage } from '@features/reporting/ReportingPage';
import { makeConsoleSession, makeMerchant, makeOnboarding } from '@/test/factories';
import { server, url } from '@/test/msw/server';
import { configure, renderWithProviders, screen, within } from '@/test/render';

// Page tests here wait on several MSW round trips; on a loaded CI box the default 1s async
// window is not enough, and a flake that only appears under load teaches people to re-run.
// Set at module scope: a test's timeout is fixed when `it` registers it.
vi.setConfig({ testTimeout: 30_000 });
beforeAll(() => {
  configure({ asyncUtilTimeout: 5_000 });
});
afterAll(() => {
  configure({ asyncUtilTimeout: 1_000 });
  vi.resetConfig();
});

const pending = makeConsoleSession({ merchant: makeMerchant({ status: 'pending_review' }) });

describe('OnboardingChecklist', () => {
  it('ticks off what is done and links to the onboarding page', async () => {
    server.use(
      http.get(url('/onboarding'), () =>
        HttpResponse.json(
          makeOnboarding({ requirements_due: ['bank_account', 'identity_document'] }),
        ),
      ),
    );

    renderWithProviders(<OnboardingChecklist />, { session: pending });

    const steps = await screen.findByRole('list', { name: 'Setup steps' });
    expect(within(steps).getByText(/Business details/).textContent).toMatch(/Done/);
    expect(within(steps).getByText(/Bank account for payouts/).textContent).toMatch(/To do/);
    expect(screen.getByRole('link', { name: 'Continue setup' })).toHaveAttribute(
      'href',
      '/onboarding',
    );
  });

  it('is on Home for a pending merchant only', async () => {
    renderWithProviders(<ReportingPage />, { session: pending });
    expect(
      await screen.findByRole('region', { name: 'Activate your account' }),
    ).toBeInTheDocument();
  });

  it('is absent from Home for an active merchant', async () => {
    renderWithProviders(<ReportingPage />);

    await screen.findByRole('heading', { name: /Hello, Northwind/ });
    expect(screen.queryByRole('region', { name: 'Activate your account' })).not.toBeInTheDocument();
  });
});

describe('ActivationBanner', () => {
  it('says test mode only for a merchant awaiting review', () => {
    renderWithProviders(<ActivationBanner />, { session: pending });

    expect(screen.getByText('Test mode only until we verify your business')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Finish setting up' })).toHaveAttribute(
      'href',
      '/onboarding',
    );
  });

  it('renders nothing for an active merchant', () => {
    renderWithProviders(<ActivationBanner />);

    expect(screen.queryByText(/Test mode only/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Live payments are unavailable/)).not.toBeInTheDocument();
  });
});
