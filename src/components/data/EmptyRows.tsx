/**
 * The "nothing here" state for a table.
 *
 * This component has two call shapes, which is one more than it should have:
 *
 *  1. `<EmptyRows columnCount={n}>{node}</EmptyRows>` — what `<DataTable>` renders internally.
 *     It has to be a `<tr><td colSpan>` because it lives inside a `<tbody>`, and a bare `<div>`
 *     there is invalid HTML that Safari silently hoists out of the table.
 *  2. `<EmptyRows title="…" body="…" />` — what feature tables pass **as** `emptyState`, i.e.
 *     the node that shape 1 will wrap.
 *
 * TODO(rrefactor): split into `<EmptyRowsCell>` (shape 1) and `<EmptyState>` (shape 2) —
 * PAY-1968. Every attempt so far has touched thirty files and been bounced for scope.
 *
 * a11y: the message is inside the table's own row so it is reachable by table navigation, and
 * the cell gets `role="cell"` implicitly. It is not a live region — the table's `aria-busy`
 * already told the user something changed.
 */
import type { ReactNode } from 'react';

import { pz } from '@lib/cn';

import { color, font, space } from '../ui/tokens';

export interface EmptyRowsProps {
  /** Shape 1: the number of columns to span. Omit for shape 2. */
  columnCount?: number;
  /** Shape 2: the headline. */
  title?: string;
  /** Shape 2: one sentence explaining what would make rows appear. */
  body?: string;
  /** Shape 2: a call to action — "Create your first payout". */
  action?: ReactNode;
  children?: ReactNode;
}

/** The message block, without any table markup around it. */
function EmptyMessage({ title, body, action, children }: Omit<EmptyRowsProps, 'columnCount'>) {
  if (children) return <>{children}</>;

  return (
    <div
      className={pz('empty-rows')}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: space[2],
        padding: `${space[10]} ${space[4]}`,
        textAlign: 'center',
        fontFamily: font.family,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: font.size.lg,
          fontWeight: font.weight.semibold,
          color: color.textPrimary,
        }}
      >
        {title ?? 'Nothing here yet'}
      </p>

      {body ? (
        <p style={{ margin: 0, maxWidth: '46ch', fontSize: font.size.md, color: color.textSecondary }}>
          {body}
        </p>
      ) : null}

      {action ? <div style={{ marginTop: space[2] }}>{action}</div> : null}
    </div>
  );
}

export function EmptyRows({ columnCount, title, body, action, children }: EmptyRowsProps) {
  const message = <EmptyMessage title={title} body={body} action={action}>{children}</EmptyMessage>;

  if (columnCount === undefined) {
    return message;
  }

  return (
    <tr className={pz('empty-rows', 'row')}>
      <td colSpan={columnCount} style={{ padding: 0, borderBottom: 'none' }}>
        {message}
      </td>
    </tr>
  );
}
