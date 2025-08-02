/**
 * The content column.
 *
 * One place that owns the max width, the horizontal padding and the landmark element, so that
 * every route is the same width and there is exactly one `<main>` on the page. A second
 * `<main>` is not a style problem — it breaks "skip to content" and the reader's landmark
 * list, which is what `AppShell.tsx`'s skip link relies on.
 */
import type { ReactNode } from 'react';

import { pz } from '@lib/cn';

import { color, font, layout, space } from '../ui/tokens';

export type ContainerWidth = 'narrow' | 'default' | 'wide' | 'full';

export interface PageContainerProps {
  children: ReactNode;
  /**
   * `main` for a route's own content — exactly one per page. `section` and `div` for nested
   * blocks that want the same gutter.
   */
  as?: 'main' | 'section' | 'div';
  width?: ContainerWidth;
  /** Accessible name, required when `as="section"`. */
  label?: string;
  className?: string;
}

const WIDTHS: Readonly<Record<ContainerWidth, string>> = {
  // Forms and the login page. ~65ch of body text is the readable limit.
  narrow: '560px',
  default: layout.contentMaxWidth,
  // Settlement items: fourteen columns do not fit in 1280.
  wide: '1600px',
  full: '100%',
};

export function PageContainer({
  children,
  as = 'div',
  width = 'default',
  label,
  className,
}: PageContainerProps) {
  const Element = as;

  return (
    <Element
      id={as === 'main' ? 'main-content' : undefined}
      aria-label={label}
      className={pz('page-container', undefined, width) + (className ? ` ${className}` : '')}
      style={{
        width: '100%',
        maxWidth: WIDTHS[width],
        margin: '0 auto',
        padding: `${space[6]} ${space[6]} ${space[12]}`,
        fontFamily: font.family,
        color: color.textPrimary,
      }}
    >
      {children}
    </Element>
  );
}

/** Vertical rhythm between the blocks of a page. Used by detail pages with several cards. */
export function PageSections({ children }: { children: ReactNode }) {
  return <div style={{ display: 'grid', gap: space[6] }}>{children}</div>;
}
