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
const httpUrl = z
  .string()
  .min(1)
  .url()
  .refine((v) => v.startsWith('http://') || v.startsWith('https://'), {
    message: 'must be an http(s) URL',
  });

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
