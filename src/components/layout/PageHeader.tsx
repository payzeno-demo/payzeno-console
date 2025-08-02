/**
 * The `<h1>` block at the top of a route.
 *
 * Exactly one per page, and it owns the `<h1>` so that no feature has to remember to write
 * one. `useDocumentTitle` sets the tab title separately; the two are intentionally not coupled,
 * because the tab title wants "Payment pi_… · Payzeno" and the heading wants "Payment pi_…".
 *
 * `isBusy` renders a small inline spinner rather than replacing the page with a skeleton. A
 * background refetch that blanks the page the user is reading is worse than a slightly stale
 * number for 300ms.
 *
 * a11y: the breadcrumb is a labelled `<nav>` with `aria-current="page"` on the last crumb; the
 * busy indicator is `aria-hidden` because `aria-busy` on the table already says it.
 */
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

import type { Breadcrumb } from '@/types/nav';

import { pz } from '@lib/cn';

import { Spinner } from '../ui/Spinner';
import { color, font, space } from '../ui/tokens';

export interface PageHeaderProps {
  title: string;
  /** One sentence under the title. Say what the page is for, not what it is called. */
  description?: string;
  /** Actions and status pills, rendered on the right of the title row. */
  children?: ReactNode;
  /** Trail above the title. The last entry is the current page and is not a link. */
  breadcrumbs?: ReadonlyArray<Breadcrumb>;
  /** A background refetch is in flight. */
  isBusy?: boolean;
}

export function PageHeader({
  title,
  description,
  children,
  breadcrumbs,
  isBusy = false,
}: PageHeaderProps) {
  return (
    <header
      className={pz('page-header')}
      style={{
        display: 'grid',
        gap: space[2],
        paddingBottom: space[5],
        marginBottom: space[5],
        borderBottom: `1px solid ${color.border}`,
        fontFamily: font.family,
      }}
    >
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb">
          <ol
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: space[2],
              margin: 0,
              padding: 0,
              listStyle: 'none',
              fontSize: font.size.sm,
              color: color.textSecondary,
            }}
          >
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <li key={`${crumb.label}-${index}`} style={{ display: 'flex', gap: space[2] }}>
                  {crumb.to && !isLast ? (
                    <Link to={crumb.to} style={{ color: color.textLink }}>
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current={isLast ? 'page' : undefined}>{crumb.label}</span>
                  )}
                  {!isLast ? <span aria-hidden="true">/</span> : null}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: space[4],
          flexWrap: 'wrap',
        }}
      >
        <h1
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: space[3],
            margin: 0,
            fontSize: font.size.xxl,
            fontWeight: font.weight.semibold,
            lineHeight: font.lineHeight.tight,
            color: color.textPrimary,
          }}
        >
          {title}
          {isBusy ? (
            <span aria-hidden="true" style={{ display: 'inline-flex' }}>
              <Spinner size="sm" label="" tone="muted" />
            </span>
          ) : null}
        </h1>

        {children ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: space[2], flexWrap: 'wrap' }}>
            {children}
          </div>
        ) : null}
      </div>

      {description ? (
        <p style={{ margin: 0, maxWidth: '80ch', fontSize: font.size.md, color: color.textSecondary }}>
          {description}
        </p>
      ) : null}
    </header>
  );
}
