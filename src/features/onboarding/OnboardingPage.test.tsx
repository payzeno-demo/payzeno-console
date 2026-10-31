/**
 * `OnboardingPage` — RFC platform-v2 §3. A fresh signup's onboarding is `collecting` with
 * everything due (the MSW default); each case overrides what it needs.
 */
import { HttpResponse, http } from 'msw';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import type { Onboarding } from '@payzeno/contracts';

import { OnboardingPage } from '@features/onboarding/OnboardingPage';
import {
  makeConsoleSession,
  makeKycDocument,
  makeMerchant,
  makeOnboarding,
} from '@/test/factories';
import { server, url } from '@/test/msw/server';
import { configure, renderWithProviders, screen, waitFor, within } from '@/test/render';

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

const pendingSession = makeConsoleSession({ merchant: makeMerchant({ status: 'pending_review' }) });

function serve(onboarding: Onboarding) {
  server.use(http.get(url('/onboarding'), () => HttpResponse.json(onboarding)));
}

function renderPage() {
  return renderWithProviders(<OnboardingPage />, { route: '/onboarding', session: pendingSession });
}

describe('a fresh signup', () => {
  it('shows the collecting banner and every step as to do', async () => {
    renderPage();

    expect(await screen.findByText('Tell us about your business')).toBeInTheDocument();
    expect(screen.getAllByText('To do')).toHaveLength(4);
    expect(screen.getByTestId('requirements-due')).toHaveTextContent(
      'Business details, Account representative, Bank account for payouts, Identity document',
    );
    expect(screen.getByRole('button', { name: 'Submit for review' })).toBeDisabled();
  });

  it('saves the business profile with a PATCH carrying only what was filled in', async () => {
    let seen: unknown = null;
    server.use(
      http.patch(url('/onboarding'), async ({ request }) => {
        seen = await request.json();
        return HttpResponse.json(
          makeOnboarding({
            requirements_due: ['representative', 'bank_account', 'identity_document'],
          }),
        );
      }),
    );

    const { user } = renderPage();
    await user.click(await screen.findByLabelText('Website'));
    await user.paste('https://newco.example');
    await user.click(screen.getByLabelText('City'));
    await user.paste('Leeds');
    await user.click(screen.getByRole('button', { name: 'Save business details' }));

    await waitFor(() => {
      expect(seen).toEqual({
        business_profile: { website: 'https://newco.example', city: 'Leeds' },
      });
    });
  });

  it('saves the representative on its own', async () => {
    let seen: unknown = null;
    server.use(
      http.patch(url('/onboarding'), async ({ request }) => {
        seen = await request.json();
        return HttpResponse.json(makeOnboarding());
      }),
    );

    const { user } = renderPage();
    await user.click(await screen.findByLabelText('Full legal name'));
    await user.paste('Ada Owner');
    await user.click(screen.getByRole('button', { name: 'Save representative' }));

    await waitFor(() => {
      expect(seen).toEqual({ representative: { full_name: 'Ada Owner' } });
    });
  });

  it('uploads a document as base64 and refuses one over 600 KB without a request', async () => {
    let seen: Record<string, unknown> | null = null;
    server.use(
      http.post(url('/onboarding/documents'), async ({ request }) => {
        seen = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(makeKycDocument({ filename: 'passport.pdf' }), { status: 201 });
      }),
    );

    const { user } = renderPage();
    const input = await screen.findByLabelText('File');

    const tooBig = new File([new Uint8Array(700 * 1024)], 'huge.jpg', { type: 'image/jpeg' });
    await user.upload(input, tooBig);
    await user.click(screen.getByRole('button', { name: 'Upload document' }));
    expect(await screen.findByText(/huge\.jpg is 700\.0 kB/)).toBeInTheDocument();
    expect(seen).toBeNull();

    const passport = new File(['%PDF-1.4 hello'], 'passport.pdf', { type: 'application/pdf' });
    await user.upload(input, passport);
    await user.click(screen.getByRole('button', { name: 'Upload document' }));

    await waitFor(() => expect(seen).not.toBeNull());
    expect(seen).toMatchObject({
      type: 'identity_document',
      filename: 'passport.pdf',
      content_type: 'application/pdf',
      content_base64: btoa('%PDF-1.4 hello'),
    });
  });
});

describe('ready to submit', () => {
  it('submits once nothing is due', async () => {
    // Stateful, like the api: once submitted, every later read says so.
    let current = makeOnboarding({ requirements_due: [], documents: [makeKycDocument()] });
    let submitted = false;
    server.use(
      http.get(url('/onboarding'), () => HttpResponse.json(current)),
      http.post(url('/onboarding/submit'), () => {
        submitted = true;
        current = { ...current, state: 'submitted', submitted_at: '2026-03-14T09:30:00.000Z' };
        return HttpResponse.json(current);
      }),
    );

    const { user } = renderPage();
    const submit = await screen.findByRole('button', { name: 'Submit for review' });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => expect(submitted).toBe(true));
    expect(await screen.findByText('We are reviewing your application')).toBeInTheDocument();
  });

  it('lists uploaded documents by name', async () => {
    serve(makeOnboarding({ documents: [makeKycDocument({ filename: 'passport-ada.pdf' })] }));

    renderPage();

    const table = await screen.findByRole('table', {
      name: 'Documents you have uploaded for verification',
    });
    expect(within(table).getByText('passport-ada.pdf')).toBeInTheDocument();
  });
});

describe('after submitting', () => {
  it('shows the staff message verbatim when more information is needed, and reopens the forms', async () => {
    serve(
      makeOnboarding({
        state: 'needs_info',
        staff_message: 'Please upload a clearer scan of the passport photo page.',
      }),
    );

    renderPage();

    expect(await screen.findByText('We need a little more information')).toBeInTheDocument();
    expect(screen.getByTestId('staff-message')).toHaveTextContent(
      'Please upload a clearer scan of the passport photo page.',
    );
    expect(screen.getByRole('button', { name: 'Save business details' })).toBeInTheDocument();
  });

  it('locks the forms while in review', async () => {
    serve(
      makeOnboarding({
        state: 'submitted',
        requirements_due: [],
        submitted_at: '2026-03-14T09:30:00.000Z',
      }),
    );

    renderPage();

    expect(await screen.findByText('We are reviewing your application')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save business details' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Website')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Submit for review' })).not.toBeInTheDocument();
  });

  it('says so plainly when rejected', async () => {
    serve(
      makeOnboarding({ state: 'rejected', staff_message: 'We do not support this business type.' }),
    );

    renderPage();

    expect(await screen.findByText('We could not approve your application')).toBeInTheDocument();
    expect(screen.getByTestId('staff-message')).toHaveTextContent(
      'We do not support this business type.',
    );
  });

  it('celebrates approval', async () => {
    serve(
      makeOnboarding({
        state: 'approved',
        requirements_due: [],
        decided_at: '2026-03-14T09:30:00.000Z',
      }),
    );

    renderPage();

    expect(await screen.findByText('Your business is verified')).toBeInTheDocument();
  });
});
