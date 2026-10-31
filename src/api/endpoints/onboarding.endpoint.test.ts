/**
 * `OnboardingEndpoint` and `SignupEndpoint` — RFC platform-v2 §3.
 */
import { describe, expect, it } from 'vitest';

import { ApiClient } from '@api/client';
import { OnboardingEndpoint } from '@api/endpoints/onboarding.endpoint';
import { SignupEndpoint } from '@api/endpoints/signup.endpoint';
import { recordRequests } from '@/test/msw/server';

const client = () => new ApiClient({ retries: 0 });

describe('OnboardingEndpoint', () => {
  it('reads the singleton at /onboarding', async () => {
    const onboarding = await new OnboardingEndpoint(client()).get();

    expect(onboarding.object).toBe('onboarding');
    expect(onboarding.state).toBe('collecting');
  });

  it('updates with PATCH and gets the whole onboarding back', async () => {
    const recorder = recordRequests();
    const onboarding = await new OnboardingEndpoint(client()).update({
      business_profile: { website: 'https://newco.example' },
    });

    expect(recorder.requests[0]?.method).toBe('PATCH');
    expect(onboarding.business_profile.website).toBe('https://newco.example');
    expect(onboarding.requirements_due).not.toContain('business_profile');
    recorder.stop();
  });

  it('uploads a document and submits', async () => {
    const endpoint = new OnboardingEndpoint(client());

    await expect(
      endpoint.uploadDocument({
        type: 'identity_document',
        filename: 'passport.pdf',
        content_type: 'application/pdf',
        content_base64: 'JVBERi0=',
      }),
    ).resolves.toMatchObject({ object: 'kyc_document', filename: 'passport.pdf' });
    await expect(endpoint.submit()).resolves.toMatchObject({ state: 'submitted' });
  });
});

describe('SignupEndpoint', () => {
  it('creates without a session and verifies into a login', async () => {
    const endpoint = new SignupEndpoint(client());

    await expect(
      endpoint.create({
        email: 'ada@newco.example',
        password: 'long-enough-pw',
        full_name: 'Ada Owner',
        legal_name: 'NewCo Ltd',
        display_name: 'NewCo',
        country: 'GB',
        default_currency: 'GBP',
      }),
    ).resolves.toMatchObject({ object: 'signup', verification_required: true });
    await expect(endpoint.verify({ token: 'tok' })).resolves.toMatchObject({ object: 'login' });
  });
});
