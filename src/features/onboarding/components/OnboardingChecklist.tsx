/**
 * The "activate your account" card on Home, shown while the merchant is `pending_review`
 * (RFC platform-v2 §3). Same steps, same words as `/onboarding`, which it links to.
 */
import { Link } from 'react-router-dom';

import { ONBOARDING_REQUIREMENTS } from '@payzeno/contracts';

import { InlineError } from '@components/feedback/InlineError';
import { Badge } from '@components/ui/Badge';
import { Card } from '@components/ui/Card';
import { Skeleton } from '@components/ui/Skeleton';
import { ROUTES } from '@/routes';

import { REQUIREMENT_LABELS, STATE_LABELS, TEST_MODE_ONLY } from '../onboarding.copy';
import { useOnboarding } from '../useOnboarding';

export function OnboardingChecklist() {
  const { onboarding, isDue, isLoading, error } = useOnboarding();

  const submitted = onboarding?.state === 'submitted';
  const cta =
    onboarding?.state === 'needs_info'
      ? 'See what we need'
      : submitted
        ? 'View your application'
        : 'Continue setup';

  return (
    <Card
      as="section"
      aria-label="Activate your account"
      title="Activate your account"
      headingLevel={2}
      description={TEST_MODE_ONLY}
      actions={
        onboarding ? (
          <Badge tone={onboarding.state === 'needs_info' ? 'warning' : 'info'} srPrefix="Status">
            {STATE_LABELS[onboarding.state]}
          </Badge>
        ) : null
      }
    >
      {error ? (
        <InlineError id="onboarding-checklist-error" severity="status">
          Your setup progress could not be loaded.
        </InlineError>
      ) : null}
      {isLoading ? <Skeleton height="96px" /> : null}

      {onboarding ? (
        <ol aria-label="Setup steps">
          {ONBOARDING_REQUIREMENTS.map((requirement) => (
            <li key={requirement}>
              {REQUIREMENT_LABELS[requirement]} —{' '}
              {isDue(requirement) ? (
                <Badge tone="warning" size="sm" srPrefix="Step">
                  To do
                </Badge>
              ) : (
                <Badge tone="success" size="sm" srPrefix="Step">
                  Done
                </Badge>
              )}
            </li>
          ))}
          <li>
            Submit for review —{' '}
            {submitted ? (
              <Badge tone="info" size="sm" srPrefix="Step">
                Submitted
              </Badge>
            ) : (
              <Badge tone="warning" size="sm" srPrefix="Step">
                To do
              </Badge>
            )}
          </li>
        </ol>
      ) : null}

      <p>
        <Link to={ROUTES.onboarding.index}>{cta}</Link>
      </p>
    </Card>
  );
}
