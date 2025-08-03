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

