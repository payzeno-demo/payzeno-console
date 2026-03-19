/**
 * Browser entry point. Mounted by `index.html`.
 *
 * The one non-obvious thing here is the dynamic import.
 *
 * `src/config/env.ts` validates the seven `VITE_*` variables at **module load** and throws
 * `EnvConfigError` when one is missing or malformed (blueprint §5.2). A console booted against
 * a bad bundle must fail loudly rather than render an empty dashboard — an empty dashboard
 * looks like "the merchant has no payments", which is the worst possible lie for a payments
 * product to tell. Under a static import that throw happens before this module's first
 * statement and the page stays blank with an error only in devtools; behind a dynamic import
 * we can catch it and put the missing variable names on the screen, where whoever deployed the
 * bundle will actually see them.
 *
 * Nothing else belongs in this file. Provider composition is `app/AppProviders.tsx`, chrome is
 * `App.tsx`, routes are `router.tsx`.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { EnvConfigError } from '@lib/errors';

function mountPoint(): HTMLElement {
  const el = document.getElementById('root');
  if (!el) {
    throw new Error('#root is missing from index.html — the console cannot mount');
  }
  return el;
}

/**
 * The boot-failure screen. Deliberately plain DOM: it must render when the design system,
 * the router and the query client have all failed to load, so it may not import any of them.
 */
function renderBootFailure(container: HTMLElement, error: unknown): void {
  const detail =
    error instanceof EnvConfigError
      ? error.issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n')
      : String(error);

  container.innerHTML = '';

  const wrapper = document.createElement('main');
  wrapper.setAttribute('role', 'alert');
  wrapper.style.cssText =
    'max-width:60ch;margin:8vh auto;padding:24px;font:14px/1.6 ui-sans-serif,system-ui,sans-serif;color:#1c2333';

  const heading = document.createElement('h1');
  heading.style.cssText = 'font-size:18px;margin:0 0 8px';
  heading.textContent = 'The console is misconfigured';

  const body = document.createElement('p');
  body.style.cssText = 'margin:0 0 16px;color:#5b6478';
  body.textContent =
    'This build is missing required configuration, so it will not start. This is a deployment problem, not an account problem.';

  const pre = document.createElement('pre');
  pre.style.cssText =
    'margin:0;padding:12px;border-radius:6px;background:#f5f6f8;white-space:pre-wrap;font:12px/1.5 ui-monospace,SFMono-Regular,monospace';
  pre.textContent = detail;

  wrapper.append(heading, body, pre);
  container.append(wrapper);
}

async function bootstrap(): Promise<void> {
  const container = mountPoint();

  try {
    // Order matters: telemetry first, so an error thrown while the app module graph evaluates
    // is still reported. `initTelemetry()` is a no-op when `VITE_SENTRY_DSN` is empty, which is
    // the local-dev default.
    const [{ initTelemetry }, { AppProviders }, { App }] = await Promise.all([
      import('@lib/telemetry'),
      import('@app/AppProviders'),
      import('@/App'),
    ]);

    initTelemetry();

    createRoot(container).render(
      <StrictMode>
        <AppProviders>
          <App />
        </AppProviders>
      </StrictMode>,
    );
  } catch (error) {
    renderBootFailure(container, error);
    // Rethrowing keeps the failure in the browser console and in any error reporter that did
    // manage to initialise. Swallowing it here cost us half a day on the qa environment.
    throw error;
  }
}

void bootstrap();
