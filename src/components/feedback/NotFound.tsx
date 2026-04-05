/**
 * 404, both kinds: a route that does not exist and a resource that does not.
 *
 * Wording matters here for a payments product. "Charge not found" is ambiguous — the merchant
 * cannot tell whether the id is wrong or whether they are looking at the wrong account, and in
 * live/test mode confusion it is almost always the latter. So the default body says both.
 *
 * a11y: `<main>` with a heading, because this replaces the whole page content; the heading is
 * the first thing a screen reader lands on after the route change announcement.
 */
import { Link } from 'react-router-dom';

import { pz } from '@lib/cn';

import { color, font, radius, space } from '../ui/tokens';

export interface NotFoundProps {
  title?: string;
  body?: string;
  /** Where "Back to the dashboard" goes. Defaults to the reporting overview. */
  homeTo?: string;
  /** The id that was not found, rendered in mono so a typo is visible. */
  reference?: string;
}

export function NotFound({
  title = 'We could not find that',
  body = 'The record may have been deleted, or it may belong to a different account — check whether you are in live or test mode.',
  homeTo = '/',
  reference,
}: NotFoundProps) {
  return (
    <main
      className={pz('not-found')}
      style={{
        display: 'grid',
        gap: space[4],
        justifyItems: 'start',
        maxWidth: '60ch',
        padding: space[8],
        fontFamily: font.family,
        color: color.textPrimary,
      }}
    >
      <p
        aria-hidden="true"
        style={{ margin: 0, fontSize: font.size.xxl, color: color.textMuted }}
      >
        404
      </p>

      <h1 style={{ margin: 0, fontSize: font.size.xl, fontWeight: font.weight.semibold }}>{title}</h1>

      <p style={{ margin: 0, fontSize: font.size.md, color: color.textSecondary }}>{body}</p>

      {reference ? (
        <p
          style={{
            margin: 0,
            padding: `${space[1]} ${space[2]}`,
            fontFamily: font.familyMono,
            fontSize: font.size.sm,
            color: color.textSecondary,
            background: color.surfaceSunken,
            borderRadius: radius.sm,
          }}
        >
          {reference}
        </p>
      ) : null}

      <Link
        to={homeTo}
        style={{
          color: color.textLink,
          fontSize: font.size.md,
          textDecoration: 'underline',
        }}
      >
        Back to the dashboard
      </Link>
    </main>
  );
}
