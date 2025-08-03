/**
 * Feature flags.
 *
 * Build-time only. There is no flag service, no network call and no runtime override: a flag
 * is a `VITE_FEATURE_*` variable baked into the bundle, read once through `config/env.ts`.
 * Changing one means a rebuild.
