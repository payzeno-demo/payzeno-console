/**
 * Browser entry point for the admin back office. Mounted by `admin.html`.
 *
 * Same boot shape as `src/main.tsx`, for the same reason: `config/env.ts` validates the build's
 * `VITE_*` variables at module load and throws `EnvConfigError` when one is missing. Behind a
 * dynamic import that throw is catchable, and staff see what is wrong instead of a white page.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { color, font, radius, space } from '@components/ui/tokens';
import { EnvConfigError } from '@lib/errors';

function mountPoint(): HTMLElement {
  const el = document.getElementById('root');
  if (!el) throw new Error('#root is missing from admin.html — the admin app cannot mount');
  return el;
}

/** Plain DOM: it must render when React, the router and the query client failed to load. */
function renderBootFailure(container: HTMLElement, error: unknown): void {
  const detail =
    error instanceof EnvConfigError
      ? error.issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n')
      : String(error);

  container.innerHTML = '';

  const wrapper = document.createElement('main');
  wrapper.setAttribute('role', 'alert');
  Object.assign(wrapper.style, {
    maxWidth: '60ch',
    margin: `${space[16]} auto`,
    padding: space[6],
    fontFamily: font.family,
    color: color.textPrimary,
  });

  const heading = document.createElement('h1');
  Object.assign(heading.style, { fontSize: font.size.lg, margin: `0 0 ${space[2]}` });
  heading.textContent = 'Payzeno Admin is misconfigured';

  const body = document.createElement('p');
  Object.assign(body.style, { margin: `0 0 ${space[4]}`, color: color.textSecondary });
  body.textContent = 'This build is missing required configuration, so it will not start.';

  const pre = document.createElement('pre');
  Object.assign(pre.style, {
    margin: '0',
    padding: space[3],
    borderRadius: radius.md,
    background: color.surfaceMuted,
    whiteSpace: 'pre-wrap',
    fontFamily: font.familyMono,
    fontSize: font.size.sm,
  });
  pre.textContent = detail;

  wrapper.append(heading, body, pre);
  container.append(wrapper);
}

async function bootstrap(): Promise<void> {
  const container = mountPoint();

  try {
    const [{ initTelemetry }, { AdminProviders }, { AdminApp }] = await Promise.all([
      import('@lib/telemetry'),
      import('./app/AdminProviders'),
      import('./AdminApp'),
    ]);

    initTelemetry();

    createRoot(container).render(
      <StrictMode>
        <AdminProviders>
          <AdminApp />
        </AdminProviders>
      </StrictMode>,
    );
  } catch (error) {
    renderBootFailure(container, error);
    throw error;
  }
}

void bootstrap();
