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
