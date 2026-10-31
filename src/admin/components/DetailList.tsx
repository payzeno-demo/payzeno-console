/**
 * A definition list for detail pages: term on the left, value on the right. `<dl>` rather than a
 * table, because these are name/value pairs and a screen reader announces them as such.
 */
import type { ReactNode } from 'react';

import { color, font, space } from '@components/ui/tokens';

export interface DetailItem {
  term: string;
  /** `null` / `undefined` / `''` renders an em dash, so a blank field is visibly blank. */
  value: ReactNode;
}

export function DetailList({ items }: { items: ReadonlyArray<DetailItem> }) {
  return (
    <dl
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(140px, 220px) 1fr',
        columnGap: space[4],
        rowGap: space[3],
        margin: 0,
        fontFamily: font.family,
        fontSize: font.size.md,
      }}
    >
      {items.map((item) => (
        <div key={item.term} style={{ display: 'contents' }}>
          <dt style={{ color: color.textSecondary }}>{item.term}</dt>
          <dd style={{ margin: 0, color: color.textPrimary, overflowWrap: 'anywhere' }}>
            {item.value === null || item.value === undefined || item.value === '' ? (
              <span style={{ color: color.textMuted }}>—</span>
            ) : (
              item.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
