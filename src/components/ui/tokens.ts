/**
 * Design tokens.
 *
 * ADR 0005: **this file is the only source of colour and spacing values in the repo.** A hex
 * literal anywhere else is a review rejection, and tflexbox does reject them. Components read
 * `tokens.*` and never invent a shade.
 *
 * The values are emitted as CSS custom properties by `cssVariables()` (mounted once by
 * `<AppShell />`) so that dark mode and the print stylesheet can override them without a
 * re-render, while the TS objects keep the values type-checked at the call site.
 */

/** Semantic palette. Names describe the role, not the colour — `danger`, never `red`. */
export const color = {
  // surfaces
  surface: '#ffffff',
  surfaceMuted: '#f7f8fa',
  surfaceSunken: '#eef0f4',
  surfaceInverse: '#111827',
  overlay: 'rgba(17, 24, 39, 0.48)',

  // borders
  border: '#e2e5ea',
  borderStrong: '#c8cdd6',
  borderFocus: '#3b5bdb',

  // text
  textPrimary: '#111827',
  textSecondary: '#4b5563',
  textMuted: '#6b7280',
  textInverse: '#f9fafb',
  textLink: '#2f4bc4',

  // brand
  brand: '#3b5bdb',
  brandHover: '#314dbb',
  brandSubtle: '#e8ecfb',

  // status tones
  success: '#137547',
  successSubtle: '#e3f4ea',
  warning: '#8a5a00',
  warningSubtle: '#fdf1dd',
  danger: '#b42318',
  dangerSubtle: '#fdeceb',
  info: '#0b6a8f',
  infoSubtle: '#e2f2f8',
  neutral: '#4b5563',
  neutralSubtle: '#eef0f4',
} as const;

export type ColorToken = keyof typeof color;

/** 4px base scale. `space[3]` is 12px. */
export const space = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;

export type SpaceStep = keyof typeof space;

export const radius = {
  none: '0',
  sm: '4px',
  md: '6px',
  lg: '10px',
  pill: '999px',
} as const;

export const font = {
  family:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  /** Amounts, ids and anything columnar. Tabular figures keep the decimal points aligned. */
  familyMono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  size: {
    xs: '11px',
    sm: '12px',
    md: '14px',
    lg: '16px',
    xl: '20px',
    xxl: '28px',
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
  },
} as const;

export const shadow = {
  none: 'none',
  sm: '0 1px 2px rgba(17, 24, 39, 0.06)',
  md: '0 4px 12px rgba(17, 24, 39, 0.10)',
  lg: '0 12px 32px rgba(17, 24, 39, 0.16)',
  /** Focus ring. 3px at 40% is the smallest that stays visible at 200% zoom. */
  focus: `0 0 0 3px ${color.brandSubtle}`,
} as const;
