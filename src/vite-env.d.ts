/// <reference types="vite/client" />

/**
 * The seven build-time variables, declared once.
 *
 * This file and `src/config/env.ts` are the only two places allowed to mention
 * `import.meta.env` — `.eslintrc.cjs` bans `import.meta` everywhere else (ADR 0002). Declaring
 * them here does **not** make them safe to read directly; it makes `readEnv()` typed, and it
 * makes an eighth variable show up in a diff.
 *
 * Every field is `string` even where it means a boolean. Vite substitutes text; the coercion
 * lives in the zod schema in `config/env.ts`, which is where PAY-1783 ("false" is truthy) was
 * fixed.
 */
interface ImportMetaEnv {
  /** REST base, including the `/v1` prefix. `http://localhost/v1` through payzeno-nginx. */
  readonly VITE_PAYZENO_API_URL: string;
  /** `/ws/notifications` on payzeno-api. `ws://localhost/ws/notifications` locally. */
  readonly VITE_WS_URL: string;
  /** Card vault origin. Card data goes here and never to payzeno-api (ADR 0003, arc PCI). */
  readonly VITE_VAULT_PUBLIC_URL: string;
  /** One of `local` | `qa` | `staging` | `production`. Drives `<EnvironmentBanner/>`. */
  readonly VITE_ENVIRONMENT: string;
  /** `"true"` | `"false"`. Flag `settlement_explorer`. */
  readonly VITE_FEATURE_SETTLEMENT_EXPLORER: string;
  readonly env: ImportMetaEnv;
}

/**
 * `define` substitutions from `vite.config.ts`. These are replaced at build time, so they are
 * plain globals rather than fields on `import.meta.env`, and they are not part of `Env`.
 */
declare const __CONSOLE_VERSION__: string;
declare const __BUILD_SHA__: string;
declare const __PAYZENO_API_VERSION__: string;
declare const __FORCE_MOCK_TRANSPORT__: boolean;
