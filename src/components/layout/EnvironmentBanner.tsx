/**
 * "You are on staging" strip.
 *
 * Rendered on every environment except production. It exists because staging and production
 * look identical, the merchant switcher works on both, and someone once refunded a real charge
 * from what they thought was staging (PAY-1721 — the postmortem is short and unhappy).
 *
 * The build sha is in the banner so that a bug report from QA carries it without anyone having
 * to ask.
 *
 * a11y: `role="status"` and *not* focusable. It is ambient information, and putting it in the
 * tab order in front of the skip link would be actively hostile.
 */
import { pz } from '@lib/cn';

import { runtimeConfig } from '@config/runtime';

import { color, font, layout, space } from '../ui/tokens';
import type { Tone } from '../ui/tokens';

export interface EnvironmentBannerProps {
  /** Override for tests and for the login page, which renders it before providers exist. */
  environment?: string;
  buildSha?: string;
}

/** Louder as you get closer to production data. `local` is calm; `staging` is not. */
export function toneForEnvironment(environment: string): Tone {
  switch (environment) {
    case 'local':
      return 'neutral';
    case 'qa':
      return 'info';
    case 'staging':
      return 'warning';
    default:
      return 'neutral';
  }
}

const LABELS: Readonly<Record<string, string>> = {
  local: 'Local development build',
  qa: 'QA environment — data here is disposable',
  staging: 'Staging environment — this is not production data',
};

export function EnvironmentBanner({
  environment = runtimeConfig.environment,
  buildSha = runtimeConfig.buildSha,
}: EnvironmentBannerProps) {
  if (environment === 'production') return null;

  const tone = toneForEnvironment(environment);
  const background = tone === 'warning' ? color.warningSubtle : tone === 'info' ? color.infoSubtle : color.surfaceSunken;
  const foreground = tone === 'warning' ? color.warning : tone === 'info' ? color.info : color.textSecondary;

  return (
    <div
      role="status"
      className={pz('environment-banner', undefined, environment)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space[3],
        height: layout.bannerHeight,
        padding: `0 ${space[4]}`,
        background,
        color: foreground,
        borderBottom: `1px solid ${foreground}`,
        fontFamily: font.family,
        fontSize: font.size.sm,
        fontWeight: font.weight.medium,
      }}
    >
      <span>{LABELS[environment] ?? `${environment} environment`}</span>
      <span style={{ fontFamily: font.familyMono, fontSize: font.size.xs, opacity: 0.8 }}>
        build {buildSha}
      </span>
    </div>
  );
}
