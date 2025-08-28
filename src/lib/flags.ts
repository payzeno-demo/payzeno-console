/**
 * Feature flags.
 *
 * Build-time only. There is no flag service, no network call and no runtime override: a flag
 * is a `VITE_FEATURE_*` variable baked into the bundle, read once through `config/env.ts`.
 * Changing one means a rebuild.
 *
 * Exactly two flags exist. Adding a third means adding an eighth env var, which ADR 0002 says
 * is a conversation and not a PR.
 */
import { env } from '@config/env';
