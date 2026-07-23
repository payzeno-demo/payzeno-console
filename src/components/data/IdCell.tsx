/**
 * A Payzeno resource id, in a table cell.
 *
 * Ids are long (`pi_01HX9K3M7QW2R4T5Y6U7V8W9X0`) and every finance person we watched using the
 * console did the same two things with them: squinted at the last few characters to tell two
 * rows apart, then copied the whole thing into a support ticket. So: truncate in the middle,
 * keep the full value in `title` and in the clipboard.
 *
 * a11y notes (tflexbox):
 *  - the visible text is truncated, so the full id is exposed through the copy button's
 *    accessible name — a screen reader reading "p i underscore ellipsis" is useless;
 *  - the copy result is announced through a polite live region, not a toast, because a toast
 *    for every copy is noise;
 *  - `<code>` carries the mono font from tokens, not a hardcoded family.
 */
import { useCopyToClipboard } from '@hooks/useCopyToClipboard';
import { pz } from '@lib/cn';
import { truncateId } from '@lib/format';

import { IconButton } from '../ui/IconButton';
import { color, font, space, visuallyHidden } from '../ui/tokens';

export interface IdCellProps {
  value: string | null | undefined;
  /** Characters kept at the start. Settlement ids need more than charge ids do. */
  head?: number;
  /** Characters kept at the end. */
  tail?: number;
  /** Hide the copy affordance — detail pages that already show the id in full. */
  copyable?: boolean;
  /** What the id identifies, for the copy button's label: "charge", "settlement batch". */
  resourceLabel?: string;
}

export function IdCell({
  value,
  head = 8,
  tail = 4,
  copyable = true,
  resourceLabel = 'id',
}: IdCellProps) {
  const clipboard = useCopyToClipboard();

  if (!value) {
    return <span style={{ color: color.textMuted }}>—</span>;
  }

  const shown = truncateId(value, head, tail);

  return (
    <span
      className={pz('id-cell')}
      style={{ display: 'inline-flex', alignItems: 'center', gap: space[1] }}
    >
      <code
        title={value}
        style={{
          fontFamily: font.familyMono,
          fontSize: font.size.sm,
          color: color.textPrimary,
          whiteSpace: 'nowrap',
        }}
      >
        {shown}
      </code>

      {copyable ? (
        <IconButton
          size="sm"
          variant="ghost"
          label={`Copy ${resourceLabel} ${value}`}
          icon={<span aria-hidden="true">⧉</span>}
          onClick={() => {
            void clipboard.copy(value, resourceLabel);
          }}
        />
      ) : null}

      <span aria-live="polite" style={visuallyHidden as React.CSSProperties}>
        {clipboard.announcement}
      </span>
    </span>
