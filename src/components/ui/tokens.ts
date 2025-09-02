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
