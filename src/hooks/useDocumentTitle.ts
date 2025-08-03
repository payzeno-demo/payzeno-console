/**
 * Document title.
 *
 * Every page component calls this. It is not cosmetic: the title is the first thing a screen
 * reader announces after a route change, and browser history is unusable without it when a
 * merchant has six tabs of the console open.
 */
import { useEffect } from 'react';

const SUFFIX = 'Payzeno';

/** `Settlements` → `Settlements · Payzeno`. */
export function formatTitle(parts: ReadonlyArray<string>): string {
  const cleaned = parts.filter((part) => part.trim().length > 0);
  return cleaned.length === 0 ? SUFFIX : `${cleaned.join(' · ')} · ${SUFFIX}`;
}

/**
 * Set the document title for as long as the component is mounted, restoring the previous title
 * on unmount so a modal route does not leave its title behind.
 *
 * @param parts most specific first — `['ch_01HW…', 'Charges']`.
 */
export function useDocumentTitle(...parts: string[]): void {
  const title = formatTitle(parts);

  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

/**
 * Route-change announcement for assistive technology.
 *
 * React Router does not move focus or announce anything on navigation, so a keyboard user
 * hears nothing when the main region swaps. `<AppShell />` renders the live region this
 * writes into.
 */
export function useRouteAnnouncement(message: string): void {
  useEffect(() => {
    const region = document.getElementById('route-announcer');
    if (!region) return;
    // Clearing first forces a re-announce when two routes share a label.
    region.textContent = '';
    const timer = setTimeout(() => {
      region.textContent = message;
    }, 60);
    return () => clearTimeout(timer);
  }, [message]);
}
