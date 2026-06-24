/**
 * The one place in this repo that is allowed to see `import.meta.env`.
 *
 * `.eslintrc.cjs` bans `import.meta` everywhere else and re-permits it for exactly this file
 * and `vite-env.d.ts` (ADR 0002). Seven variables, no more; an eighth is a conversation, not
 * a PR.
 *
 * Owner: tflexbox. Reviewed by dhotfix — `VITE_VAULT_PUBLIC_URL` is arc-PCI surface.
 */
import { z } from 'zod';

import { EnvConfigError } from '@lib/errors';

export const ENVIRONMENTS = ['local', 'qa', 'staging', 'production'] as const;
export type EnvironmentName = (typeof ENVIRONMENTS)[number];

/** The console's one config type. Every `VITE_*` name resolves to a field here. */
export interface Env {
  apiUrl: string;
  wsUrl: string;
  vaultPublicUrl: string;
  sentryDsn: string | null;
  environment: EnvironmentName;
  featureSettlementExplorer: boolean;
  featureDisputeEvidenceV2: boolean;
}

/**
 * `VITE_FEATURE_*` arrives as the *string* "true"/"false" — Vite does not coerce. A plain
 * `Boolean(value)` makes "false" truthy, which is how the dispute evidence form shipped on in
 * production for two days (PAY-1783).
 */
const booleanish = z
  .enum(['true', 'false', '1', '0', ''])
  .transform((v) => v === 'true' || v === '1');

const httpUrl = z
  .string()
  .min(1)
  .url()
  .refine((v) => v.startsWith('http://') || v.startsWith('https://'), {
    message: 'must be an http(s) URL',
  });

const socketUrl = z
  .string()
  .min(1)
  .refine((v) => v.startsWith('ws://') || v.startsWith('wss://'), {
    message: 'must be a ws(s) URL',
  });

const schema = z.object({
  VITE_PAYZENO_API_URL: httpUrl,
  VITE_WS_URL: socketUrl,
  VITE_VAULT_PUBLIC_URL: httpUrl,
  // Empty disables Sentry entirely, which is the local-dev default.
  VITE_SENTRY_DSN: z.string().default(''),
  VITE_ENVIRONMENT: z.enum(ENVIRONMENTS).default('local'),
  VITE_FEATURE_SETTLEMENT_EXPLORER: booleanish.default('true'),
  VITE_FEATURE_DISPUTE_EVIDENCE_V2: booleanish.default('false'),
});

/** Strip a single trailing slash so `${apiUrl}${path}` never produces a double slash. */
function normaliseBase(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

/**
 * Parse and validate the build-time environment.
 *
 * Exported (rather than inlined into the module-level constant) so `env.test.ts` can drive it
 * with a hand-built record instead of mutating `import.meta.env`.
 *
 * @throws {EnvConfigError} when a required variable is missing or malformed.
 */
export function readEnv(raw: Record<string, unknown> = import.meta.env): Env {
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    throw new EnvConfigError(
      parsed.error.issues.map((issue) => ({
        path: issue.path.join('.') || '(root)',
        message: issue.message,
      })),
    );
  }

  const value = parsed.data;

  return {
    apiUrl: normaliseBase(value.VITE_PAYZENO_API_URL),
    wsUrl: value.VITE_WS_URL,
    vaultPublicUrl: normaliseBase(value.VITE_VAULT_PUBLIC_URL),
    sentryDsn: value.VITE_SENTRY_DSN.trim() === '' ? null : value.VITE_SENTRY_DSN.trim(),
    environment: value.VITE_ENVIRONMENT,
    featureSettlementExplorer: value.VITE_FEATURE_SETTLEMENT_EXPLORER,
    featureDisputeEvidenceV2: value.VITE_FEATURE_DISPUTE_EVIDENCE_V2,
  };
}

/**
 * Evaluated once, at module load. `main.tsx` imports `config/runtime.ts`, which imports this,
 * so a misconfigured bundle throws `EnvConfigError` before React mounts.
 */
export const env: Env = readEnv();
