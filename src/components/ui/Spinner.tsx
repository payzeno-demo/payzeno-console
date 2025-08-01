/**
 * Spinner.
 *
 * `label` is required and defaults to "Loading". Passing an empty string is legal and means
 * "this spinner is decorative because the surrounding control already announces its busy
 * state" — `<Button isLoading>` does exactly that.
 *
 * Respects `prefers-reduced-motion` by slowing rather than stopping: a frozen spinner reads as
 * a hung page.
 */
import { cn, pz } from '@lib/cn';

import { color, visuallyHidden } from './tokens';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps {
  size?: SpinnerSize;
  /** Screen-reader text. Empty string marks the spinner decorative. */
  label?: string;
  /** Override the stroke colour — defaults to `currentColor` so it inherits from the button. */
  tone?: 'inherit' | 'brand' | 'muted';
  className?: string;
}

const SIZE_PX: Record<SpinnerSize, number> = { sm: 14, md: 20, lg: 32 };

export function Spinner({ size = 'md', label = 'Loading', tone = 'inherit', className }: SpinnerProps) {
  const px = SIZE_PX[size];
  const stroke = tone === 'brand' ? color.brand : tone === 'muted' ? color.textMuted : 'currentColor';
  const decorative = label === '';

  return (
    <span
      className={cn(pz('spinner'), className)}
      role={decorative ? undefined : 'status'}
      aria-hidden={decorative || undefined}
      style={{ display: 'inline-flex', alignItems: 'center' }}
    >
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        style={{ animation: 'pz-spin 800ms linear infinite' }}
      >
        <circle cx="12" cy="12" r="9" stroke={stroke} strokeOpacity="0.2" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      </svg>
      {decorative ? null : <span style={visuallyHidden}>{label}</span>}
    </span>
  );
}

/**
 * The keyframes this component needs. Injected once by `<AppShell>` alongside the token custom
 * properties, so there is no global stylesheet to keep in sync.
 */
export const SPINNER_KEYFRAMES = `
@keyframes pz-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .pz-spinner svg { animation-duration: 2400ms; }
}
`;
